const { getDb } = require('../utils/database');

function search(req, res) {
  try {
    const db = getDb();
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ courses: [], modules: [], lessons: [], notes: [], bookmarks: [] });

    const term = `%${q.trim()}%`;

    const courses = db.prepare(`
      SELECT id, name, thumbnail, total_lessons, completed_lessons, 'course' as type
      FROM courses WHERE name LIKE ? LIMIT 10
    `).all(term);

    const modules = db.prepare(`
      SELECT m.id, m.name, m.course_id, c.name as course_name, 'module' as type
      FROM modules m JOIN courses c ON c.id = m.course_id
      WHERE m.name LIKE ? LIMIT 10
    `).all(term);

    const lessons = db.prepare(`
      SELECT l.id, l.name, l.course_id, l.module_id, c.name as course_name, m.name as module_name, 'lesson' as type
      FROM lessons l
      JOIN courses c ON c.id = l.course_id
      JOIN modules m ON m.id = l.module_id
      WHERE l.name LIKE ? LIMIT 20
    `).all(term);

    const notes = db.prepare(`
      SELECT n.id, n.content, n.timestamp, n.lesson_id, n.course_id,
        l.name as lesson_name, c.name as course_name, 'note' as type
      FROM notes n
      JOIN lessons l ON l.id = n.lesson_id
      JOIN courses c ON c.id = n.course_id
      WHERE n.content LIKE ? LIMIT 10
    `).all(term);

    const bookmarks = db.prepare(`
      SELECT b.id, b.title, b.timestamp, b.lesson_id, b.course_id, b.category,
        l.name as lesson_name, c.name as course_name, 'bookmark' as type
      FROM bookmarks b
      JOIN lessons l ON l.id = b.lesson_id
      JOIN courses c ON c.id = b.course_id
      WHERE b.title LIKE ? LIMIT 10
    `).all(term);

    res.json({ courses, modules, lessons, notes, bookmarks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { search };
