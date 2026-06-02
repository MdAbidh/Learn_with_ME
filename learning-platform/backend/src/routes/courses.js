const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/courseController');

router.get('/', ctrl.getCourses);
router.post('/import', ctrl.importCourse);
router.get('/:id', ctrl.getCourse);
router.put('/:id', ctrl.updateCourse);
router.delete('/:id', ctrl.deleteCourse);
router.post('/:id/rate', ctrl.rateCourse);
router.post('/:id/rescan', ctrl.rescanCourse);
router.post('/:id/thumbnail', ctrl.uploadThumbnail);
router.post('/:id/unlock-all', ctrl.unlockAllLessons);

module.exports = router;
