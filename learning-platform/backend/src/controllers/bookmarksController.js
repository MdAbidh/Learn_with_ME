const { getDb } = require('../utils/database');

function getBookmarks(req, res) {
  try {
    const db = getDb();
    const { lessonId } = req.params;
    const bookmarks = db.prepare('SELECT * FROM bookmarks WHERE lesson_id = ? ORDER BY timestamp ASC').all(lessonId);
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function createBookmark(req, res) {
  try {
    const db = getDb();
    const { lessonId } = req.params;
    const { title, timestamp, category, course_id } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const result = db.prepare('INSERT INTO bookmarks (lesson_id, course_id, title, timestamp, category) VALUES (?, ?, ?, ?, ?)')
      .run(lessonId, course_id, title, timestamp || 0, category || 'general');

    const bookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(result.lastInsertRowid);
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function deleteBookmark(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function getAllBookmarks(req, res) {
  try {
    const db = getDb();
    const { courseId } = req.params;
    const bookmarks = db.prepare(`
      SELECT b.*, l.name as lesson_name, m.name as module_name
      FROM bookmarks b
      JOIN lessons l ON l.id = b.lesson_id
      JOIN modules m ON m.id = l.module_id
      WHERE b.course_id = ?
      ORDER BY b.created_at DESC
    `).all(courseId);
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getBookmarks, createBookmark, deleteBookmark, getAllBookmarks };
