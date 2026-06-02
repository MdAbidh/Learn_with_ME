const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/progressController');

router.put('/lesson/:lessonId', ctrl.updateProgress);
router.post('/lesson/:lessonId', ctrl.updateProgress);
router.put('/lesson/:lessonId/position', ctrl.savePosition);
router.post('/lesson/:lessonId/position', ctrl.savePosition);
router.get('/resume/:courseId', ctrl.getResumePosition);
router.post('/history', ctrl.addWatchHistory);
router.get('/history', ctrl.getWatchHistory);

module.exports = router;
