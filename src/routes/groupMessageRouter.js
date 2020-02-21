const router = require('express').Router();
const groupMessageController = require('../Controllers/groupMessageController');

router.get('/record/',groupMessageController.getAllRecords);

router.get('/record/:recordId',groupMessageController.getRecord);

router.post('/subscribe',groupMessageController.subscribe);

router.post('/unsubscribe',groupMessageController.unsubscribe);

router.get('/subscribers',groupMessageController.getSubscribers);

router.put('/record/',groupMessageController.updateRecord);

router.delete('/record/',groupMessageController.deleteRecord);

router.post('/record/',groupMessageController.creatRecord);

router.get('/rooms/',groupMessageController.getRooms);

router.get('/record/status/:recordId',groupMessageController.getRecordStatus);

module.exports = router;