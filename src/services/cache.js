const pool = require('../utils/db');
const client = require('../utils/redis').getClient();

const hget = (key,field)=>{
    return new Promise((resolve,reject)=>{
        client.hget(key,field,(err,value)=>{
            err ? reject(err) : resolve(value);
        });
    })
}

const hset = client.hset;

const del = client.del;

const roomRead = async (nameSpace,room,query,data)=>{
    const key = JSON.stringify({nameSpace,room});
    const field = JSON.stringify({query,data});
    const cachedResult = await hget(key,field);
    if(cachedResult){
        return JSON.parse(cachedResult);
    }
    const result = await pool.myExecute(query,data);
    setImmediate(()=>{
        cachedResult = JSON.stringify(result);
        hset(key,field,cachedResult);
    });
    return result;
}

const roomWrite = async (nameSpace,room,query,data)=>{
    setImmediate(()=>{
        const key = JSON.stringify({nameSpace,room});
        del(key);
    });
    return pool.myExecute(query,data)
}

const userRead = async (nameSpace,user,query,data)=>{
    const key = JSON.stringify({nameSpace,user});
    const field = JSON.stringify({query,data});
    const cachedResult = await hget(key,field);
    if(cachedResult){
        return JSON.parse(cachedResult);
    }
    const result = await pool.myExecute(query,data);
    setImmediate(()=>{
        cachedResult = JSON.stringify(result);
        hset(key,field,cachedResult);
    });
    return result;
}

const userWrite = async (nameSpace,user,query,data)=>{
    setImmediate(()=>{
        const key = JSON.stringify({nameSpace,user});
        del(key);
    });
    return pool.myExecute(query,data);
}

pool.userRead = userRead;
pool.userWrite = userWrite;
pool.roomRead = roomRead;
pool.roomWrite = roomWrite;