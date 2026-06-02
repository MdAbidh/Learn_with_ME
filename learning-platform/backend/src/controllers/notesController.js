const { getDb } = require('../utils/database');

function getNotes(req, res) {
  try {
    const db = getDb();
    const { lessonId } = req.params;
    const notes = db.prepare('SELECT * FROM notes WHERE lesson_id = ? ORDER BY timestamp ASC').all(lessonId);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function createNote(req, res) {
  try {
    const db = getDb();
    const { lessonId } = req.params;
    const { content, timestamp, course_id } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const result = db.prepare('INSERT INTO notes (lesson_id, course_id, content, timestamp) VALUES (?, ?, ?, ?)')
      .run(lessonId, course_id, content, timestamp || 0);

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function updateNote(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { content } = req.body;
    db.prepare('UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(content, id);
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function deleteNote(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    db.prepare('DELETE FROM notes WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function getAllNotes(req, res) {
  try {
    const db = getDb();
    const { courseId } = req.params;
    const notes = db.prepare(`
      SELECT n.*, l.name as lesson_name, m.name as module_name
      FROM notes n
      JOIN lessons l ON l.id = n.lesson_id
      JOIN modules m ON m.id = l.module_id
      WHERE n.course_id = ?
      ORDER BY n.created_at DESC
    `).all(courseId);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getNotes, createNote, updateNote, deleteNote, getAllNotes };
