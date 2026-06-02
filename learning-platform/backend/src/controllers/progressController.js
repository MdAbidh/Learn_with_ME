const { getDb } = require('../utils/database');

// Update lesson progress
function updateProgress(req, res) {
  try {
    const db = getDb();
    const { lessonId } = req.params;
    const { watch_percentage, last_position, course_id, module_id } = req.body;

    const threshold = parseFloat(db.prepare("SELECT value FROM settings WHERE key = 'completion_threshold'").get()?.value || '90');
    const isCompleted = watch_percentage >= threshold ? 1 : 0;

    // Upsert progress
    db.prepare(`
      INSERT INTO progress (lesson_id, course_id, module_id, watch_percentage, last_position, is_completed, completed_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(lesson_id) DO UPDATE SET
        watch_percentage = MAX(excluded.watch_percentage, watch_percentage),
        last_position = excluded.last_position,
        is_completed = MAX(excluded.is_completed, is_completed),
        completed_at = CASE WHEN excluded.is_completed = 1 AND is_completed = 0 THEN CURRENT_TIMESTAMP ELSE completed_at END,
        updated_at = CURRENT_TIMESTAMP
    `).run(lessonId, course_id, module_id, watch_percentage, last_position, isCompleted,
      isCompleted ? new Date().toISOString() : null);

    // Update lesson record
    db.prepare(`
      UPDATE lessons SET watch_percentage = ?, last_position = ?, is_completed = ?,
        completed_at = CASE WHEN ? = 1 AND is_completed = 0 THEN CURRENT_TIMESTAMP ELSE completed_at END,
        is_current = 0
      WHERE id = ?
    `).run(watch_percentage, last_position, isCompleted, isCompleted, lessonId);

    if (isCompleted) {
      unlockNextLesson(db, lessonId, course_id, module_id);
      updateCourseProgress(db, course_id);
    }

    res.json({ success: true, is_completed: isCompleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function unlockNextLesson(db, lessonId, courseId, moduleId) {
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId);
  if (!lesson) return;

  // Find next lesson in same module
  const nextInModule = db.prepare(`
    SELECT * FROM lessons WHERE module_id = ? AND order_index > ? ORDER BY order_index LIMIT 1
  `).get(moduleId, lesson.order_index);

  if (nextInModule) {
    db.prepare('UPDATE lessons SET is_unlocked = 1, is_current = 1 WHERE id = ?').run(nextInModule.id);
    return;
  }

  // Module complete - check if all lessons done
  const moduleTotal = db.prepare('SELECT COUNT(*) as cnt FROM lessons WHERE module_id = ?').get(moduleId).cnt;
  const moduleDone = db.prepare('SELECT COUNT(*) as cnt FROM lessons WHERE module_id = ? AND is_completed = 1').get(moduleId).cnt;

  if (moduleTotal === moduleDone) {
    db.prepare('UPDATE modules SET completed_lessons = total_lessons WHERE id = ?').run(moduleId);

    // Unlock next module
    const currentMod = db.prepare('SELECT * FROM modules WHERE id = ?').get(moduleId);
    const nextMod = db.prepare(`
      SELECT * FROM modules WHERE course_id = ? AND order_index > ? ORDER BY order_index LIMIT 1
    `).get(courseId, currentMod.order_index);

    if (nextMod) {
      db.prepare('UPDATE modules SET is_unlocked = 1 WHERE id = ?').run(nextMod.id);
      // Unlock first lesson of next module
      const firstLesson = db.prepare('SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index LIMIT 1').get(nextMod.id);
      if (firstLesson) {
        db.prepare('UPDATE lessons SET is_unlocked = 1, is_current = 1 WHERE id = ?').run(firstLesson.id);
      }
    }
  }
}

function updateCourseProgress(db, courseId) {
  const total = db.prepare('SELECT COUNT(*) as cnt FROM lessons WHERE course_id = ?').get(courseId).cnt;
  const completed = db.prepare('SELECT COUNT(*) as cnt FROM lessons WHERE course_id = ? AND is_completed = 1').get(courseId).cnt;

  db.prepare('UPDATE courses SET completed_lessons = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(completed, courseId);

  if (total > 0 && total === completed) {
    db.prepare('UPDATE courses SET is_completed = 1, completion_date = CURRENT_TIMESTAMP WHERE id = ?').run(courseId);
  }

  // Update module progress
  const modules = db.prepare('SELECT id FROM modules WHERE course_id = ?').all(courseId);
  modules.forEach(mod => {
    const modCompleted = db.prepare('SELECT COUNT(*) as cnt FROM lessons WHERE module_id = ? AND is_completed = 1').get(mod.id).cnt;
    db.prepare('UPDATE modules SET completed_lessons = ? WHERE id = ?').run(modCompleted, mod.id);
  });
}

// Save watch position (called frequently)
function savePosition(req, res) {
  try {
    const db = getDb();
    const { lessonId } = req.params;
    const { last_position, course_id, module_id } = req.body;

    db.prepare(`
      INSERT INTO progress (lesson_id, course_id, module_id, last_position, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(lesson_id) DO UPDATE SET last_position = excluded.last_position, updated_at = CURRENT_TIMESTAMP
    `).run(lessonId, course_id, module_id, last_position);

    db.prepare('UPDATE lessons SET last_position = ?, is_current = 1 WHERE id = ?').run(last_position, lessonId);
    db.prepare('UPDATE lessons SET is_current = 0 WHERE course_id = ? AND id != ?').run(course_id, lessonId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get resume position for a course
function getResumePosition(req, res) {
  try {
    const db = getDb();
    const { courseId } = req.params;

    const currentLesson = db.prepare(`
      SELECT l.*, m.name as module_name, p.last_position as saved_position
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      LEFT JOIN progress p ON p.lesson_id = l.id
      WHERE l.course_id = ? AND l.is_current = 1
      ORDER BY l.id DESC LIMIT 1
    `).get(courseId);

    if (!currentLesson) {
      // Return first lesson
      const first = db.prepare(`
        SELECT l.*, m.name as module_name
        FROM lessons l JOIN modules m ON m.id = l.module_id
        WHERE l.course_id = ? ORDER BY m.order_index, l.order_index LIMIT 1
      `).get(courseId);
      return res.json(first || null);
    }

    res.json(currentLesson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Add watch history entry
function addWatchHistory(req, res) {
  try {
    const db = getDb();
    const { lesson_id, course_id, module_id, duration_watched } = req.body;
    db.prepare('INSERT INTO watch_history (lesson_id, course_id, module_id, duration_watched) VALUES (?, ?, ?, ?)')
      .run(lesson_id, course_id, module_id, duration_watched || 0);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get watch history
function getWatchHistory(req, res) {
  try {
    const db = getDb();
    const history = db.prepare(`
      SELECT wh.*, l.name as lesson_name, c.name as course_name, c.thumbnail
      FROM watch_history wh
      JOIN lessons l ON l.id = wh.lesson_id
      JOIN courses c ON c.id = wh.course_id
      ORDER BY wh.watched_at DESC LIMIT 50
    `).all();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { updateProgress, savePosition, getResumePosition, addWatchHistory, getWatchHistory };
