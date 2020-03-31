const router = require('express').Router();
const userRouter = require('./auth');
const publisher = require('../Controllers/publisher');
const is_auth = require('../middlewares/is-auth');
const { check } = require('express-validator');
const validate = require('../middlewares/validate');
const {accessLevels} = require('../../config/magicStrings.json');
const {throw422} = require('../scripts/errors');

router.post('/room/',is_auth,[
    check('data')
    .isJSON()
    .custom(data=>{
        if(data.defaultAccessLevel){
            const inculded = Object.values(accessLevels).includes(data.defaultAccessLevel);
            if(!inculded) throw422('Invalid AccessLevel');
        }
        if(data.channel){
            if(typeof data.channel !== "boolean"){
                if(!data.channel.private || typeof data.channel.private !== "boolean") throw422('Invalid Formatting');
            }
        }
    })
    .withMessage('Please Send Valid JSON String')
],validate,publisher.createRoom);

router.post('/join/',is_auth,[
    check('socketId')
    .custom((socketId,{req})=>{
        const valid = req.Publisher.isValidSocketId(socketId);
        if(!valid) throw422('Invalid SocketId');
    })
],validate,publisher.join);

router.post('/invite/',is_auth,[
    check('room')
    .isInt({gt:0}),
    check('invitedId')
    .isInt({gt:0}),
    check('inviteAccessLevel')
    .custom(inviteAccessLevel=>{
        const inculded = Object.values(accessLevels).includes(inviteAccessLevel);
        if(!inculded) throw422('Invalid AccessLevel');
    })
],validate,publisher.invite);

router.post('/subscribe',is_auth,[
    check('room')
    .isInt({gt:0})
],validate,publisher.subscribe);

router.post('/unsubscribe',is_auth,[
    check('room')
    .isInt({gt:0})
],validate,publisher.unsubscribe);

router.post('/leave/',is_auth,publisher.leave);

router.delete('/remove/',is_auth,[
    check('room')
    .isInt({gt:0}),
    check('removedId')
    .isInt({gt:0})
],validate,publisher.remove);

router.get('/subscribers',is_auth,[
    check('room')
    .isInt({gt:0})
],validate,publisher.getSubscribers);

router.delete('/room/',is_auth,[
    check('room')
    .isInt({gt:0})
],validate,publisher.deleteRoom);

router.get('/records/',is_auth,[
    check('room')
    .isInt({gt:0})
],validate,publisher.getAllRecords);

router.get('/records/unseen/',is_auth,publisher.getUnseenRecords);

router.get('/records/user/',is_auth,publisher.getUserRecords);

router.get('/record/',is_auth,[
    check('room')
    .isInt({gt:0}),
    check('recordId')
    .isInt({gt:0})
],validate,publisher.getRecord);

router.put('/record/',is_auth,[
    check('room')
    .isInt({gt:0}),
    check('recordId')
    .isInt({gt:0}),
    check('data')
    .isJSON()
    .custom(data=>{
        if(data.sharable){
            if(typeof data.sharable !== "boolean") throw422("Invalid Formatting");
        }
    })
    .withMessage('Please Send Valid JSON String')
],validate,publisher.updateRecord);

router.delete('/record/',is_auth,[
    check('room')
    .isInt({gt:0}),
    check('recordId')
    .isInt({gt:0})
],validate,publisher.deleteRecord);

router.post('/record/',is_auth,[
    check('room')
    .isInt({gt:0}),
    check('data')
    .isJSON()
    .custom(data=>{
        if(data.sharable){
            if(typeof data.sharable !== "boolean") throw422("Invalid Formatting");
        }
    })
    .withMessage('Please Send Valid JSON String')
],validate,publisher.createRecord);

router.put('/recordStatus/',is_auth,[
    check('room')
    .isInt({gt:0}),
    check('recordId')
    .isInt({gt:0})
],validate,publisher.seenCheck);

router.get('/rooms/',is_auth,[
    check('room')
    .isInt({gt:0})
],validate,publisher.getNestedRooms);

router.post('/nestedRoom/',is_auth,[
    check('room')
    .isInt({gt:0}),
    check('data')
    .isJSON()
    .custom(data=>{
        if(data.defaultAccessLevel){
            const inculded = Object.values(accessLevels).includes(data.defaultAccessLevel);
            if(!inculded) throw422('Invalid AccessLevel');
        }
        if(data.channel){
            if(typeof data.channel !== "boolean"){
                if(!data.channel.private || typeof data.channel.private !== "boolean") throw422('Invalid Formatting');
            }
        }
    })
    .withMessage('Please Send Valid JSON String')
],validate,publisher.createNestedRoom);

router.delete('/reference/',is_auth,[
    check('room')
    .isInt({gt:0}),
    check('recordId')
    .isInt({gt:0})
],validate,publisher.removeRecord);

router.post('/reference/',is_auth,[
    check('room')
    .isInt({gt:0}),
    check('destination')
    .isInt({gt:0}),
    check('recordId')
    .isInt({gt:0})
],validate,publisher.copyRecord);

router.put('/reference/',is_auth,[
    check('room')
    .isInt({gt:0}),
    check('destination')
    .isInt({gt:0}),
    check('recordId')
    .isInt({gt:0})
],validate,publisher.cutRecord);

router.use('/user/',userRouter);

module.exports = router;