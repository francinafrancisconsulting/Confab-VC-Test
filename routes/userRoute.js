const express = require('express');
const router = express();

const meetingController = require("../controllers/meetingController");

router.get('/',meetingController.loadIndex);
router.get('/meeting',meetingController.loadMeeting);
router.get('/stream',meetingController.loadStream);

module.exports=router;