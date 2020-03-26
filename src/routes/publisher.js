const router = require('express').Router();
const userRouter = require('./auth');
const publisher = require('../Controllers/publisher');
const is_auth = require('../middlewares/is-auth');

router.post('/room/',is_auth,publisher.createRoom);

router.post('/join/',is_auth,publisher.join);

router.post('/invite/',is_auth,publisher.invite);

router.post('/subscribe',is_auth,publisher.subscribe);

router.post('/unsubscribe',is_auth,publisher.unsubscribe);

router.post('/leave/',is_auth,publisher.join);

router.delete('/remove/',is_auth,publisher.remove);

router.get('/subscribers',is_auth,publisher.getSubscribers);

router.delete('/room/',is_auth,publisher.deleteRoom);

router.get('/record/',is_auth,publisher.getAllRecords);

router.get('/record/:recordId',is_auth,publisher.getRecord);

router.put('/record/',is_auth,publisher.updateRecord);

router.delete('/record/',is_auth,publisher.deleteRecord);

router.post('/record/',is_auth,publisher.createRecord);

router.put('/recordStatus/',is_auth,publisher.seenCheck);

router.use('/user/',userRouter);

module.exports = router;