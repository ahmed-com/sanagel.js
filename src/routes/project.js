const router = require('express').Router();
const publishers = require('../Models/publisher');
const publisherRouter = require('./publisher');

router.post('/api/create',(req,res,next)=>{
    const nameSpace = req.body.nameSpace;
    publishers.save(nameSpace);
    res.json({message : 'done'});
});

router.use('/:nameSpace/',(req,res,next)=>{
    const nameSpace = req.params.nameSpace;
    req.Publisher = publishers.get(nameSpace);
    next()
},publisherRouter);

module.exports = router;