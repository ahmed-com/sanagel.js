const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('./utils/socket').init(server);
const bodyParser = require('body-parser');
const redis = require('./utils/redis');

redis.init();
require('./services/cache');

const path = require('path');
const publicPath = path.join(__dirname,'/../../client');
const port =process.env.PORT || 3000;

const projectRouter = require('./routes/project');

app.use(bodyParser.json());
app.use(express.static(publicPath)); 

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods','OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });


app.use('/',projectRouter);

app.use((req,res,next)=>{
    const err = new Error();
    err.message = 'Page Not Found !';
    err.status = 404;
    next(err);
})

app.use((err,req,res,next)=>{
    console.log(err);
    const message = err.message || "UNEXPECTED ERROR";
    const status = err.status || 500;
    res.status(status).json({
        message 
    });
})


server.listen(port,()=>{
    console.log(`server is up at port ${port}`);
});