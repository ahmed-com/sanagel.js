const router = require('express').Router();
const groupMessage = require('../Controllers/groupMessageController');

router.get('/record/',groupMessage.getAllRecords);

router.get('/record/:recordId',groupMessage.getRecord);

router.post('/subscribe',groupMessage.subscribe);

router.post('/unsubscribe',groupMessage.unsubscribe);

router.get('/subscribers',groupMessage.getSubscribers);

router.put('/record/',groupMessage.updateRecord);

router.delete('/record/',groupMessage.deleteRecord);

router.post('/record/',groupMessage.creatRecord);

router.get('/rooms/',groupMessage.getRooms);

router.get('/record/status/:recordId',groupMessage.getRecordStatus);

module.exports = router;