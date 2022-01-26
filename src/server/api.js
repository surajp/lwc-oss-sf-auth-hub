// Simple Express server setup to serve for local testing/dev API server
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const fetch = require('node-fetch');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { randomUUID } = require('crypto');
const authFunctions = require('./admin.js');
const encdec = require('./encryptdecrypt.js');
const genHash = require('./hasher.js');
const query = require('./dbconn.js');
const BASEURLS = { prod: 'https://login.salesforce.com', sbx: 'https://test.salesforce.com' };
const HOST = process.env.API_HOST || 'localhost';
const PORT = process.env.API_PORT || 8080;
const client_id = process.env.AUTHHUB_CLIENT_ID;
const client_secret = process.env.AUTHHUB_CLIENT_SECRET;
const redirect_path = '/authcallback';
const CLIENT_URL = `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}`;
const REFRESH_TOKEN_IV_DELIMITER = '|||||';

const corsOptions = {
    origin: CLIENT_URL,
    credentials: true,
    optionsSuccessStatus: 204
};

const app = express();
app.use(cookieParser());
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(authFunctions.resolveUid);
app.use(authFunctions.auditLog);
app.use((error, req, res, next) => {
    if (res.headersSent) {
        next(error);
    }
    res.status(400).render('400', { message: error.message });
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const initLogin = (req, res, next) => {
    req.isLogin = true;
    next();
};

const canThisConnectionBeAdded = async (username, uid, env) => {
    //TODO: Check agains environment as well (prod vs sandbox)
    const issandbox = env === 'sbx';
    const fetchExistingConnectionQuery = 'Select id from connections where username=$1 and issandbox=$2';
    const result = await query(fetchExistingConnectionQuery, [username, issandbox]);
    if (!result.rows || result.rows.length === 0) return true; //connection with this username does not exist
    const fetchAccessLevelQuery = "Select 1 from orgshares where user_id=$1 and org_id=$2 and accesslevel='Owner'";
    const shares = await query(fetchAccessLevelQuery, [uid, result.rows[0].id]);
    if (shares.rowCount === 1) return true; //current user is the Owner of this org, and is allowd to re-authenticate
    return false; //current user may not add this existing connection again
};

const addNewConnectionToDb = async (userObj, uid, env, notes) => {
    const issandbox = env === 'sbx';
    const addToDbQuery =
        'INSERT INTO CONNECTIONS(id,instance_url,refresh_token,username,issandbox,notes) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (username,issandbox) DO UPDATE SET refresh_token=$7,notes=$8 RETURNING id';
    let recordId = randomUUID();
    const encrypted = await encdec.encrypt(userObj.refresh_token);
    const encryptedToken = encrypted.encryptedData + REFRESH_TOKEN_IV_DELIMITER + encrypted.iv;
    const data = await query(addToDbQuery, [recordId, userObj.instance_url, encryptedToken, userObj.username, issandbox, notes, encryptedToken, notes]);
    recordId = await data.rows[0].id;
    const addOrgShareQuery = 'INSERT into orgshares (user_id,org_id,accesslevel) values($1,$2,$3) ON CONFLICT(org_id,user_id) DO NOTHING';
    return query(addOrgShareQuery, [uid, recordId, 'Owner']);
};

const resolveOrgIdFromShareId = async (req, res, next) => {
    try {
        const data = await query('Select org_id from orgshares where id=$1', [req.params.shareId]);
        req.params.orgId = data.rows[0].org_id;
        next();
    } catch (err) {
        next(err);
    }
};

app.post('/api/v1/logout', initLogin, authFunctions.verifyIdToken, authFunctions.authorizeUser, (req, res) => {
    res.clearCookie('sfhub_idtoken');
    res.status(200).end();
});

app.post('/api/v1/login', initLogin, authFunctions.verifyIdToken, authFunctions.authorizeUser, (req, res, next) => {
    try {
        res.cookie('sfhub_idtoken', req.body.idToken, { sameSite: 'lax' });
        res.status(200).end();
    } catch (err) {
        next(err);
    }
});

app.get('/authcallback', authFunctions.verifyStateHash, authFunctions.authorizeUser, async (req, res, next) => {
    try {
        const redirect_uri = req.protocol + '://' + req.get('host') + redirect_path;
        console.log('redirect_uri', redirect_uri);
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code: req.query.code,
            client_id,
            client_secret,
            redirect_uri
        });
        const baseUrl = BASEURLS[req.env];
        if (!baseUrl) res.status(400).json({ message: 'Invalid environment received from state ' + req.env });

        let resp = await fetch(`${baseUrl}/services/oauth2/token?`, {
            method: 'POST',
            body
        });
        resp = await resp.json();
        let idresp = await fetch(resp.id, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${resp.access_token}`,
                Accept: 'application/json'
            }
        });
        idresp = await idresp.json();
        resp.username = idresp.username;

        if ((await canThisConnectionBeAdded(resp.username, req.uid, req.env)) === false)
            res.status(400).render('400', { message: 'Insufficient privileges to overwrite existing connection' });
        else {
            await addNewConnectionToDb(resp, req.uid, req.env, req.notes);
            res.redirect(302, resp.instance_url + '/secur/frontdoor.jsp?sid=' + resp.access_token + '&retURL=/lightning/page/home');
        }
    } catch (err) {
        next(err);
    }
});

app.post('/api/v1/users', authFunctions.authorizeUser, async (req, res, next) => {
    try {
        const searchTerm = req.body.searchTerm;
        const queryText = 'SELECT name,email,id FROM users WHERE LOWER(name) like LOWER($1)';
        const data = await query(queryText, ['%' + searchTerm + '%']);
        //const data = await query(queryText);
        res.status(200).json(data.rows);
    } catch (err) {
        next(err);
    }
});

app.delete('/api/v1/connections/:orgId', authFunctions.authorizeUser, authFunctions.verifyClaim('owner'), async (req, res, next) => {
    try {
        const orgId = req.params.orgId;
        const deleteOrgQuery = 'DELETE FROM connections WHERE id=$1';
        await query(deleteOrgQuery, [orgId]);
        res.status(200).end(); //only send 200 for a successful delete
    } catch (err) {
        next(err);
    }
});

app.get('/api/v1/connections', async (req, res, next) => {
    try {
        const queryText = 'SELECT c.id,username,instance_url,accesslevel,issandbox,notes FROM connections c,orgshares o WHERE c.id=o.org_id and o.user_id=$1';
        const data = await query(queryText, [req.uid]);
        res.status(200);
        res.json({
            rows: data.rows.map((row) => ({
                id: row.id,
                url: row.instance_url,
                username: row.username,
                accesslevel: row.accesslevel,
                issandbox: row.issandbox,
                notes: row.notes
            }))
        });
    } catch (err) {
        next(err);
    }
});

app.post('/api/v1/connections/:orgId/open', authFunctions.authorizeUser, authFunctions.verifyClaim('read'), async (req, res, next) => {
    try {
        const orgId = req.params.orgId;
        const queryText = 'SELECT instance_url,refresh_token FROM connections WHERE id=$1';
        const data = await query(queryText, [orgId]);
        const encryptedToken = data.rows[0].refresh_token;
        const [encryptedData, iv] = encryptedToken.split(REFRESH_TOKEN_IV_DELIMITER);
        const refresh_token = await encdec.decrypt({ iv, encryptedData });
        const instance_url = data.rows[0].instance_url;
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id,
            client_secret,
            refresh_token
        });
        let resp = await fetch(`${instance_url}/services/oauth2/token`, {
            body,
            method: 'POST'
        });
        resp = await resp.json();
        //console.log(JSON.stringify(resp));
        const url = resp.instance_url + '/secur/frontdoor.jsp?sid=' + resp.access_token + '&retURL=/lightning/page/home';
        //console.log(url);
        res.json({ url });
    } catch (err) {
        next(err);
    }
});

app.post('/api/v1/oauthurl', authFunctions.authorizeUser, (req, res, next) => {
    try {
        const hashedToken = genHash(req.cookies.sfhub_idtoken);
        const state = { hashedToken, env: req.query.env, notes: req.query.notes };
        const encodedState = encodeURIComponent(JSON.stringify(state));
        const redirect_uri = 'http://' + req.get('host') + redirect_path;
        const sfenv = req.query.env || 'prod';
        const baseUrl = BASEURLS[sfenv];
        if (!baseUrl) res.status(400).json({ message: 'Environment(env) param should be one of ' + Object.keys(BASEURLS) });
        const sfOAuthUrl = `${baseUrl}/services/oauth2/authorize?prompt=login%20consent&client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&state=${encodedState}`;
        console.log('>>> oauth url ' + sfOAuthUrl);
        res.status(200).json({
            url: sfOAuthUrl
        });
    } catch (err) {
        next(err);
    }
});

app.get('/api/v1/endpoint', (req, res) => {
    res.json({ success: true });
});

app.get('/api/v1/shares/:orgId', authFunctions.authorizeUser, authFunctions.verifyClaim('manage'), async (req, res, next) => {
    try {
        const orgId = req.params.orgId;
        const queryText = 'SELECT o.id,u.name,u.email,o.user_id,o.accesslevel FROM orgshares o,users u WHERE org_id=$1 and user_id=u.id';
        const data = await query(queryText, [orgId]);
        res.status(200).json(data.rows);
    } catch (err) {
        next(err);
    }
});

app.post('/api/v1/shares/:orgId', authFunctions.authorizeUser, authFunctions.verifyClaim('manage'), async (req, res, next) => {
    try {
        const data = req.body.shares;
        const orgId = req.params.orgId;
        const currentUserAccessLevel = req.user.accesslevel; //added by 'verifyClaim' method
        const sharesToSave = data.filter((share) => (share.id + '').startsWith('new') || share.isDirty);
        const mergeQuery =
            'INSERT into orgshares(org_id,user_id,accesslevel) values($1,$2,$3) ON CONFLICT on constraint orgshare_uniq DO UPDATE SET accesslevel=$3';
        const results = [];
        for (const share of sharesToSave) {
            const fetchCurrentSharesQuery = 'SELECT accesslevel from orgshares where org_id=$1 and user_id=$2';
            //eslint-disable-next-line no-await-in-loop
            const currentShares = await query(fetchCurrentSharesQuery, [orgId, share.user_id]);
            if (currentShares.rows.length > 0) {
                const currentShareAccessLevel = currentShares.rows[0].accesslevel;
                if (!authFunctions.isClaimChangeAllowed(currentUserAccessLevel, currentShareAccessLevel, share.accesslevel)) continue;
            }
            //eslint-disable-next-line no-await-in-loop
            results.push(await query(mergeQuery, [orgId, share.user_id, share.accesslevel]));
        }
        res.status(200).send({ results });
    } catch (err) {
        next(err);
    }
});

app.delete('/api/v1/shares/:shareId', authFunctions.authorizeUser, resolveOrgIdFromShareId, authFunctions.verifyClaim('manage'), async (req, res, next) => {
    try {
        const shareId = req.params.shareId;
        const deleteSharesQuery = 'delete from orgshares where id=$1';
        await query(deleteSharesQuery, [shareId]);
        res.sendStatus(200);
    } catch (err) {
        next(err);
    }
});

app.post('/api/v1/history/:orgId', authFunctions.authorizeUser, authFunctions.verifyClaim('manage'), async (req, res, next) => {
    try {
        const loginUrlForOrg = `/api/v1/connections/${req.params.orgId}/open`;
        let loginHistoryQuery = 'Select u.name,u.email,l.created from auditlog l,users u where l.url=$1 and u.id=l.user_id order by l.created desc limit 10';
        const data = await query(loginHistoryQuery, [loginUrlForOrg]);
        res.json(data.rows);
    } catch (err) {
        next(err);
    }
});

app.listen(PORT, () => console.log(`✅  API Server started: //${HOST}:${PORT}/api/v1/endpoint`));
