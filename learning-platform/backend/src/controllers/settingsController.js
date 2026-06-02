const { getDb } = require('../utils/database');

function getSettings(req, res) {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function updateSettings(req, res) {
  try {
    const db = getDb();
    const updates = req.body;
    const upsert = db.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);
    const updateAll = db.transaction(() => {
      Object.entries(updates).forEach(([key, value]) => upsert.run(key, String(value)));
    });
    updateAll();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Export backup — stream JSON directly (no temp file needed, works on serverless)
async function exportBackup(req, res) {
  try {
    const db = getDb();

    const data = {
      exported_at: new Date().toISOString(),
      version: '1.0.0',
      courses: db.prepare('SELECT * FROM courses').all(),
      modules: db.prepare('SELECT * FROM modules').all(),
      lessons: db.prepare('SELECT * FROM lessons').all(),
      progress: db.prepare('SELECT * FROM progress').all(),
      notes: db.prepare('SELECT * FROM notes').all(),
      bookmarks: db.prepare('SELECT * FROM bookmarks').all(),
      watch_history: db.prepare('SELECT * FROM watch_history').all(),
      ratings: db.prepare('SELECT * FROM ratings').all(),
      tags: db.prepare('SELECT * FROM tags').all(),
      certificates: db.prepare('SELECT * FROM certificates').all(),
      settings: db.prepare('SELECT * FROM settings').all(),
      learning_sessions: db.prepare('SELECT * FROM learning_sessions').all(),
    };

    const filename = `backup-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Import backup
async function importBackup(req, res) {
  try {
    const db = getDb();
    if (!req.files?.backup) return res.status(400).json({ error: 'No backup file provided' });

    const data = JSON.parse(req.files.backup.data.toString());

    const restore = db.transaction(() => {
      // Restore settings
      if (data.settings) {
        data.settings.forEach(s => {
          db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(s.key, s.value);
        });
      }
      // Note: Full restore would need careful handling of IDs
      // For safety, we only restore notes, bookmarks, ratings, and settings
      if (data.notes) {
        data.notes.forEach(n => {
          db.prepare('INSERT OR IGNORE INTO notes (id, lesson_id, course_id, content, timestamp, created_at) VALUES (?,?,?,?,?,?)')
            .run(n.id, n.lesson_id, n.course_id, n.content, n.timestamp, n.created_at);
        });
      }
      if (data.bookmarks) {
        data.bookmarks.forEach(b => {
          db.prepare('INSERT OR IGNORE INTO bookmarks (id, lesson_id, course_id, title, timestamp, category, created_at) VALUES (?,?,?,?,?,?,?)')
            .run(b.id, b.lesson_id, b.course_id, b.title, b.timestamp, b.category, b.created_at);
        });
      }
    });
    restore();

    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getSettings, updateSettings, exportBackup, importBackup };
