const query = require('./dbconn.js');
const claims = require('./claims.js');

const auditLog = async (req, res, next) => {
    const op = req.originalUrl;
    uid = req.uid;
    const logQuery = 'Insert into auditlog(operation,userid,request) values($1,$2,$3)';
    query(logQuery, [op, uid, JSON.stringify(req.body)]);
    next();
};

const loginHistory = async (req, res, next) => {
    const uid = req.uid;
    const orgId = req.body.orgId;
    const status = req.status;
    const loginHistQuery = 'Insert into loginhistory(orgid,userid,status) values($1,$2)';
    query(loginHistQuery, [orgId, uid]);
    next();
};
