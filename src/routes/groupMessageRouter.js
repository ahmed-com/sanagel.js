const router = require('express').Router();
const groupMessage = require('../Controllers/groupMessageController');
const isAuth = require('../middlewares/is-auth');

router.post('/join/',isAuth,groupMessage.join);

router.post('/subscribe',isAuth,groupMessage.subscribe);

router.post('/unsubscribe',isAuth,groupMessage.unsubscribe);

router.post('/leave/',isAuth,groupMessage.join);

router.delete('/remove/',isAuth,groupMessage.remove);

router.get('/subscribers',isAuth,groupMessage.getSubscribers);

router.get('/record/',isAuth,groupMessage.getAllRecords);

router.get('/record/:recordId',isAuth,groupMessage.getRecord);

router.put('/record/',isAuth,groupMessage.updateRecord);

router.delete('/record/',isAuth,groupMessage.deleteRecord);

router.post('/record/',isAuth,groupMessage.creatRecord);

module.exports = router;