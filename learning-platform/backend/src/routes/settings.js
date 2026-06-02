const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/settingsController');

router.get('/', ctrl.getSettings);
router.put('/', ctrl.updateSettings);
router.get('/backup', ctrl.exportBackup);
router.get('/backup/export', ctrl.exportBackup);
router.post('/backup/import', ctrl.importBackup);
router.post('/restore', ctrl.importBackup);

module.exports = router;
