const mysql = require('mysql2');
const toUnnamed = require('named-placeholders')();
const client = require('./redis').getClient();

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

const hget = (key,field)=>{
    return new Promise((resolve,reject)=>{
        client.hget(key,field,(err,value)=>{
            err ? reject(err) : resolve(value);
        });
    })
}

const hset = client.hset;

const del = client.del;

const recordRead = async (nameSpace,room,query,data)=>{
    const key = JSON.stringify({nameSpace,room});
    const field = JSON.stringify({query,data});
    const cachedResult = await hget(key,field);
    if(cachedResult){
        return JSON.parse(cachedResult);
    }
    const result = await execute(query,data);
    setImmediate(()=>{
        cachedResult = JSON.stringify(result);
        hset(key,field,cachedResult);
    });
    return result;
}

const recordWrite = async (nameSpace,room,query,data)=>{
    setImmediate(()=>{
        const key = JSON.stringify({nameSpace,room});
        del(key);
    });
    return execute(query,data)
}

pool.myExecute = execute;

pool.recordRead = recordRead;

pool.recordWrite = recordWrite;

module.exports = pool;