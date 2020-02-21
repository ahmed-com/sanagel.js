const {mongoConnect} = require('./src/utils/db');
mongoConnect(()=>{
    require('./src/app');
});