const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const { getDb } = require('../utils/database');

// Formats that browsers can play natively (no transcode needed)
const NATIVE_FORMATS = new Set(['.mp4', '.m4v', '.webm', '.ogg', '.ogv']);

// MIME types for native formats
const NATIVE_MIME = {
  '.mp4':  'video/mp4',
  '.m4v':  'video/mp4',
  '.webm': 'video/webm',
  '.ogg':  'video/ogg',
  '.ogv':  'video/ogg',
};

// ── Stream video ──────────────────────────────────────────────────────────────
router.get('/stream/:lessonId', (req, res) => {
  try {
    const db     = getDb();
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.lessonId);
    if (!lesson)                    return res.status(404).json({ error: 'Lesson not found' });

    const filePath = lesson.file_path;
    if (!fs.existsSync(filePath))   return res.status(404).json({ error: 'Video file not found on disk' });

    const ext = path.extname(filePath).toLowerCase();

    // ── Native format: direct range-based streaming ──────────────────────────
    if (NATIVE_FORMATS.has(ext)) {
      const stat     = fs.statSync(filePath);
      const fileSize = stat.size;
      const range    = req.headers.range;
      const mime     = NATIVE_MIME[ext] || 'video/mp4';

      if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start     = parseInt(startStr, 10);
        const end       = endStr ? parseInt(endStr, 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
          'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges':  'bytes',
          'Content-Length': chunkSize,
          'Content-Type':   mime,
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type':   mime,
          'Accept-Ranges':  'bytes',
        });
        fs.createReadStream(filePath).pipe(res);
      }
      return;
    }

    // ── Non-native format: transcoding not available in serverless environment ──
    // (.ts, .mkv, .avi, .mov, .flv, .wmv, .m2ts, .mts …)
    return res.status(415).json({
      error: `Format "${ext}" requires transcoding which is not supported in the web version. ` +
             `Please convert the video to MP4, WebM, or use the Electron desktop app.`,
    });

  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ── Serve resource file ───────────────────────────────────────────────────────
router.get('/resource/:resourceId', (req, res) => {
  try {
    const db       = getDb();
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.resourceId);
    if (!resource)                        return res.status(404).json({ error: 'Resource not found' });
    if (!fs.existsSync(resource.file_path)) return res.status(404).json({ error: 'File not found on disk' });

    res.setHeader('Content-Disposition', `inline; filename="${resource.file_name || resource.name}"`);
    res.sendFile(resource.file_path);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Browse local folders ──────────────────────────────────────────────────────
router.get('/browse', (req, res) => {
  try {
    const dirPath = req.query.path || (process.platform === 'win32' ? 'C:\\' : '/');
    if (!fs.existsSync(dirPath)) return res.status(404).json({ error: 'Path not found' });

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const dirs = entries
      .filter(e => e.isDirectory())
      .map(e => ({ name: e.name, path: path.join(dirPath, e.name), type: 'directory' }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ current: dirPath, parent: path.dirname(dirPath), entries: dirs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
