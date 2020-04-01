require('dotenv').config();
const redis = require('./src/utils/redis');
redis.init({},()=>{
    require('./src/app');
});