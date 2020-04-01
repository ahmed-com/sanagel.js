const redis = require('redis');

let redisClient;

exports.init = (options,callback)=>{
    redisClient = redis.createClient(options);
    redisClient.on('connect',()=>{
        console.log('connected to redis');
        callback(redisClient);
    });
}

exports.getClient = ()=> redisClient;