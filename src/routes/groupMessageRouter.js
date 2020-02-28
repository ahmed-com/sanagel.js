const router = require('express').Router();
const groupMessage = require('../Controllers/groupMessageController');

router.post('/join/',groupMessage.join);

router.post('/subscribe',groupMessage.subscribe);

router.post('/unsubscribe',groupMessage.unsubscribe);

router.post('/leave/',groupMessage.join);

router.delete('/remove/',groupMessage.remove);

router.get('/subscribers',groupMessage.getSubscribers);

router.get('/record/',groupMessage.getAllRecords);

router.get('/record/:recordId',groupMessage.getRecord);

router.put('/record/',groupMessage.updateRecord);

router.delete('/record/',groupMessage.deleteRecord);

router.post('/record/',groupMessage.creatRecord);

module.exports = router;