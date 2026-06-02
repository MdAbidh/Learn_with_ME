const { getDb } = require('../utils/database');

function getAnalytics(req, res) {
  try {
    const db = getDb();

    const totalCourses = db.prepare('SELECT COUNT(*) as cnt FROM courses').get().cnt;
    const completedCourses = db.prepare('SELECT COUNT(*) as cnt FROM courses WHERE is_completed = 1').get().cnt;
    const totalLessons = db.prepare('SELECT COUNT(*) as cnt FROM lessons').get().cnt;
    const completedLessons = db.prepare('SELECT COUNT(*) as cnt FROM lessons WHERE is_completed = 1').get().cnt;

    const totalWatchTime = db.prepare('SELECT COALESCE(SUM(duration_watched), 0) as total FROM watch_history').get().total;

    // Daily learning time (last 30 days)
    const dailyTime = db.prepare(`
      SELECT date, SUM(duration) as total_seconds
      FROM learning_sessions
      WHERE date >= date('now', '-30 days')
      GROUP BY date ORDER BY date ASC
    `).all();

    // Weekly time
    const weeklyTime = db.prepare(`
      SELECT strftime('%Y-W%W', date) as week, SUM(duration) as total_seconds
      FROM learning_sessions
      WHERE date >= date('now', '-12 weeks')
      GROUP BY week ORDER BY week ASC
    `).all();

    // Learning streak
    const streak = calculateStreak(db);

    // Heatmap data (last 365 days)
    const heatmap = db.prepare(`
      SELECT date, SUM(duration) as total_seconds, COUNT(*) as sessions
      FROM learning_sessions
      WHERE date >= date('now', '-365 days')
      GROUP BY date ORDER BY date ASC
    `).all();

    // Recently watched
    const recentlyWatched = db.prepare(`
      SELECT DISTINCT c.id, c.name, c.thumbnail, c.completed_lessons, c.total_lessons,
        MAX(wh.watched_at) as last_watched
      FROM watch_history wh
      JOIN courses c ON c.id = wh.course_id
      GROUP BY c.id ORDER BY last_watched DESC LIMIT 10
    `).all();

    // Active courses (started but not completed)
    const activeCourses = db.prepare(`
      SELECT * FROM courses WHERE completed_lessons > 0 AND is_completed = 0
      ORDER BY updated_at DESC LIMIT 5
    `).all();

    res.json({
      totalCourses, completedCourses, totalLessons, completedLessons,
      totalWatchTime, dailyTime, weeklyTime, streak, heatmap,
      recentlyWatched, activeCourses
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function calculateStreak(db) {
  const sessions = db.prepare(`
    SELECT DISTINCT date FROM learning_sessions ORDER BY date DESC
  `).all().map(r => r.date);

  if (!sessions.length) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sessions[0] !== today && sessions[0] !== yesterday) return 0;

  let current = sessions[0] === today ? today : yesterday;
  for (const date of sessions) {
    if (date === current) {
      streak++;
      const d = new Date(current);
      d.setDate(d.getDate() - 1);
      current = d.toISOString().split('T')[0];
    } else break;
  }
  return streak;
}

// Start learning session
function startSession(req, res) {
  try {
    const db = getDb();
    const { course_id, lesson_id } = req.body;
    const date = new Date().toISOString().split('T')[0];
    const result = db.prepare('INSERT INTO learning_sessions (course_id, lesson_id, start_time, date) VALUES (?, ?, CURRENT_TIMESTAMP, ?)')
      .run(course_id || null, lesson_id || null, date);
    res.json({ sessionId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// End learning session
function endSession(req, res) {
  try {
    const db = getDb();
    const { sessionId } = req.params;
    const { duration } = req.body;
    db.prepare('UPDATE learning_sessions SET end_time = CURRENT_TIMESTAMP, duration = ? WHERE id = ?')
      .run(duration || 0, sessionId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAnalytics, startSession, endSession };
