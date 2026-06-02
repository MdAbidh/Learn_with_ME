const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/certificateController');

router.post('/:courseId/generate', ctrl.generateCertificate);
router.get('/:courseId', ctrl.getCertificate);
router.get('/:certId/download', ctrl.downloadCertificate);

// Legacy routes
router.post('/course/:courseId/generate', ctrl.generateCertificate);
router.get('/course/:courseId', ctrl.getCertificate);
router.get('/download/:certId', ctrl.downloadCertificate);

module.exports = router;
