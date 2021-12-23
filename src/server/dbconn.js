const { Pool } = require('pg');
const pool = new Pool();

const query = (queryStr, params) => {
    return new Promise((resolve, reject) => {
        if (params && Array.isArray(params) && params.length > 0) {
            pool.query(queryStr, params, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        } else {
            pool.query(queryStr, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        }
    });
};
module.exports = query;
