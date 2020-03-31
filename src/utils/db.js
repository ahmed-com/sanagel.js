const mysql = require('mysql2');
const toUnnamed = require('named-placeholders')();

const pool = mysql.createPool({
    host     : "localhost",
    user     : "root",
    password : process.env.DBPASSWORD,
    database : 'testing'
});

const execute = (query,data)=>{
    const [unnamedQuery,dataArray] = toUnnamed(query,data);
    return new Promise((resolve,reject)=>{
        pool.execute(unnamedQuery, dataArray,(err, rows)=>{
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    })
}

pool.myExecute = execute;

module.exports = pool;