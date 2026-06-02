const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookmarksController');

router.get('/lesson/:lessonId', ctrl.getBookmarks);
router.post('/lesson/:lessonId', ctrl.createBookmark);
router.delete('/:id', ctrl.deleteBookmark);
router.get('/course/:courseId', ctrl.getAllBookmarks);

module.exports = router;
