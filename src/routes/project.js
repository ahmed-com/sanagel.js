const router = require('express').Router();
const publishers = require('../Models/publisher');
const publisherRouter = require('./publisher');

router.post('/api/create',(req,res,next)=>{
    const nameSpace = req.body.nameSpace;
    publishers.create(nameSpace)
    .then(()=>{
        res.json({message : 'done'});
    })
    .catch(err=> console.log(err));
});

router.use('/:nameSpace/',(req,res,next)=>{
    const nameSpace = req.params.nameSpace;
    req.Publisher = publishers.get(nameSpace);
    next()
},publisherRouter);

module.exports = router;