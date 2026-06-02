const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notesController');

router.get('/lesson/:lessonId', ctrl.getNotes);
router.post('/lesson/:lessonId', ctrl.createNote);
router.put('/:id', ctrl.updateNote);
router.delete('/:id', ctrl.deleteNote);
router.get('/course/:courseId', ctrl.getAllNotes);

module.exports = router;
