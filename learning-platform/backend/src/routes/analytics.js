const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analyticsController');

router.get('/', ctrl.getAnalytics);
router.post('/session/start', ctrl.startSession);
router.put('/session/:sessionId/end', ctrl.endSession);
router.post('/session/:sessionId/end', ctrl.endSession);

module.exports = router;
