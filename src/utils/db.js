var mysql = require('mysql2');

var pool = mysql.createPool({
    host     : "localhost",
    user     : "root",
    password : process.env.DBPASSWORD,
    database : 'testing'
});

pool.config.namedPlaceholders = true;

const excute = (query,data)=>{
    return new Promise((resolve,reject)=>{
        pool.execute(query, data,(err, rows)=>{
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    })
}

pool.execute = excute;

module.exports = pool;