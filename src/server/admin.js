const genHash = require('./hasher.js');
const query = require('./dbconn.js');
const masker = require('./masker.js');
const maskedProps = require('./masks.js');
const claims = require('./claims.js');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_APP_CLIENT_ID);

const getUserFromToken = async (token) => {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_APP_CLIENT_ID
    });
    const payload = ticket.getPayload();
    return payload;
};

const createNewUser = async (userRecord) => {
    const newUserQuery = 'INSERT into users(id,email,name) values($1,$2,$3)';
    await query(newUserQuery, [userRecord.sub, userRecord.email, userRecord.name]);
};

const resolveUid = async (req, res, next) => {
    const token = req.body.idToken || req.cookies.sfhub_idtoken;
    try {
        //console.log('>> token ', token);
        if (!token) throw Error('Session invalid');
        req.user = await getUserFromToken(token);
        const uid = req.user.sub;
        req.uid = uid;
        next();
    } catch (err) {
        console.error(err.message);
        console.error('ResolveUid::Unauthorized');
        next(err);
    }
};

const verifyIdToken = async (req, res, next) => {
    try {
        if (req.uid) {
            next();
        } else {
            throw new Error('Invalid token');
        }
    } catch (err) {
        console.error(JSON.stringify(err));
        console.error('verifyIdToken::Unauthorized');
        next({ status: 401 });
    }
};

const authorizeUser = async (req, resp, next) => {
    try {
        const uid = req.uid;
        const getUserQuery = 'Select id from users where id=$1';
        let data = await query(getUserQuery, [uid]);
        //console.log('rows ', data.rows);
        if (!data?.rows?.length) {
            if (!req.isLogin) throw new Error('Unauthorized');
            //console.log('email ', req.user.email);
            const getUserByEmailQuery = 'Select id from authorized_users where email=$1';
            data = await query(getUserByEmailQuery, [req.user.email]);
            if (data?.rows?.length === 1) {
                await createNewUser(req.user);
            } else {
                throw new Error('Unauthorized');
            }
        }
        next();
    } catch (err) {
        console.error('authorizeUser::Unauthorized', JSON.stringify(err));
        next({ status: 401 });
    }
};

const verifyStateHash = async (req, res, next) => {
    try {
        const state = JSON.parse(decodeURIComponent(req.query.state));
        const recoveredHashToken = state.hashedToken;
        const env = state.env; //prod or sandbox
        const notes = state.notes; //notes added by user
        const idToken = req.cookies.sfhub_idtoken;
        const hashedToken = genHash(idToken);
        if (recoveredHashToken === hashedToken) {
            req.user = await getUserFromToken(idToken);
            req.uid = req.user.sub;
            req.env = env;
            req.notes = notes;
            next();
        } else throw Error('Invalid state');
    } catch (err) {
        console.error('verifyStateHash', err);
        next({ message: 'Unauthorized', status: 401 });
    }
};

const verifyClaim = (claim) => async (req, res, next) => {
    try {
        const userId = req.uid;
        const orgId = req.params.orgId;
        if (!orgId || !userId || !claim || !claims.orgClaims[claim]) {
            next({ status: 401 });
            return;
        }
        const claimsList = claims.orgClaims[claim];
        const claimParams = claimsList.map((c, i) => '$' + (i + 3)).join(',');
        const claimQuery = 'Select count(1) count from orgshares where user_id=$1 and org_id=$2 and accesslevel in (' + claimParams + ')';
        const data = await query(claimQuery, [userId, orgId, ...claimsList]);
        if (data.rows[0].count > 0) next();
        else next({ status: 401 });
    } catch (err) {
        console.error('verifyClaim', err);
        next({ message: 'Unauthorized', status: 401 });
    }
};

const auditLog = async (req, res, next) => {
    try {
        const { ip, hostname, method, path, body } = req;
        const params = req.query;
        const uid = req.uid;
        const maskedBody = masker(body, maskedProps);
        const maskedParams = masker(params, maskedProps);
        const auditlogQuery = 'insert into auditlog(user_id,ip_address,url,method,body,params,hostname) values($1,$2,$3,$4,$5,$6,$7)';
        query(auditlogQuery, [uid, ip, path, method, JSON.stringify(maskedBody), JSON.stringify(maskedParams), hostname]);
        next();
    } catch (err) {
        console.error('auditLog', err);
    }
};

module.exports = { verifyIdToken, resolveUid, authorizeUser, verifyStateHash, verifyClaim, auditLog };
