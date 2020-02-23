const redis = require('redis');

let redisClient;

exports.init = (options)=>{
    redisClient = redis.createClient(options);
}

exports.redisClient = redisClient;