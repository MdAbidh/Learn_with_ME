const express = require('express');
const router = express.Router();

const courseRoutes = require('./courses');
const progressRoutes = require('./progress');
const notesRoutes = require('./notes');
const bookmarksRoutes = require('./bookmarks');
const analyticsRoutes = require('./analytics');
const searchRoutes = require('./search');
const certificateRoutes = require('./certificates');
const settingsRoutes = require('./settings');
const videoRoutes = require('./video');

router.use('/courses', courseRoutes);
router.use('/progress', progressRoutes);
router.use('/notes', notesRoutes);
router.use('/bookmarks', bookmarksRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/search', searchRoutes);
router.use('/certificates', certificateRoutes);
router.use('/settings', settingsRoutes);
router.use('/video', videoRoutes);

module.exports = router;
