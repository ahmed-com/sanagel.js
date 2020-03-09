const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('./utils/socket').init(server);
const bodyParser = require('body-parser');
const db = require('./utils/db');
const redis = require('./utils/redis');

redis.init();

const path = require('path');
const publicPath = path.join(__dirname,'/../../client');
const port =process.env.PORT || 3000;

// const groupMessageRouter = require('./routes/groupMessageRouter');
const projectRouter = require('./routes/project');

app.use(bodyParser.json());
app.use(express.static(publicPath)); 

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods','OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

// app.use('/groupMessage',groupMessageRouter);
app.use('/',projectRouter);

db.sync()
.then(result=>{
    // User.create({userName : 'one', mail : 'one@test.test'});
    // User.create({userName : 'two', mail : 'two@test.test'});
    // User.create({userName : 'three', mail : 'three@test.test'});
    // User.create({userName : 'four', mail : 'fourth@test.test'});
    server.listen(port,()=>{
        console.log(`server is up at port ${port}`);
    });
})
.catch(err=>{
    console.log(err);
})
