const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('./utils/socket').init(server);
const bodyParser = require('body-parser');

const path = require('path');
const publicPath = path.join(__dirname,'/../client');
const port =process.env.PORT || 3000;

const groupMessageRouter = require('./routes/groupMessageRouter');

app.use(bodyParser.json());
app.use(express.static(publicPath)); 

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods','OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

app.use('/groupMessage',groupMessageRouter);

// mongoose.connect('mongodb+srv://Ahmed007:nzRWwk8LWejz81le@cluster0-immln.mongodb.net/ANS?retryWrites=true&w=majority')
// .then(result=>{
    server.listen(port,()=>{
        console.log(`server is up at port ${port}`)
    });
// })
// .catch(err=>{
//     console.log(err)
// })