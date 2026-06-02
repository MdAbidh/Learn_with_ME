const { getDb } = require('../utils/database');
const { scanFolder } = require('../services/courseScanner');
const { ensureThumbnail } = require('../services/thumbnailGenerator');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');

// Import a course folder
async function importCourse(req, res) {
  try {
    const { folderPath } = req.body;
    if (!folderPath) return res.status(400).json({ error: 'folderPath is required' });
    if (!fs.existsSync(folderPath)) return res.status(400).json({ error: 'Folder does not exist' });

    const db = getDb();

    // Check if already imported
    const existing = db.prepare('SELECT id FROM courses WHERE folder_path = ?').get(folderPath);
    if (existing) return res.status(409).json({ error: 'Course already imported', courseId: existing.id });

    const scanned = scanFolder(folderPath);
    if (scanned.total_lessons === 0) return res.status(400).json({ error: 'No video files found in folder' });

    // Insert course
    const courseInsert = db.prepare(`
      INSERT INTO courses (name, folder_path, total_modules, total_lessons, tags)
      VALUES (?, ?, ?, ?, '[]')
    `);
    const courseResult = courseInsert.run(scanned.name, scanned.folder_path, scanned.total_modules, scanned.total_lessons);
    const courseId = courseResult.lastInsertRowid;

    // Handle thumbnail
    const thumbUrl = await ensureThumbnail(courseId, scanned.name, scanned.thumbnail);
    db.prepare('UPDATE courses SET thumbnail = ? WHERE id = ?').run(thumbUrl, courseId);

    // Insert modules and lessons in a transaction
    const insertAll = db.transaction(() => {
      let globalLessonIndex = 0;

      scanned.modules.forEach((mod, modIdx) => {
        const modInsert = db.prepare(`
          INSERT INTO modules (course_id, name, folder_path, order_index, total_lessons, is_unlocked)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const modResult = modInsert.run(courseId, mod.name, mod.folder_path, mod.order_index, mod.lessons.length, modIdx === 0 ? 1 : 0);
        const moduleId = modResult.lastInsertRowid;

        mod.lessons.forEach((lesson, lesIdx) => {
          const isFirst = globalLessonIndex === 0;
          db.prepare(`
            INSERT INTO lessons (module_id, course_id, name, file_path, file_name, order_index, is_unlocked, is_current)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(moduleId, courseId, lesson.name, lesson.file_path, lesson.file_name, lesson.order_index, 1, isFirst ? 1 : 0);

          globalLessonIndex++;
        });

        mod.resources?.forEach(res => {
          db.prepare(`
            INSERT INTO resources (module_id, course_id, name, file_path, file_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(moduleId, courseId, res.name, res.file_path, res.file_type, res.file_size);
        });
      });
    });

    insertAll();

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    res.json({ success: true, course });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: err.message });
  }
}

// Get all courses
function getCourses(req, res) {
  try {
    const db = getDb();
    const courses = db.prepare(`
      SELECT c.*, r.rating as user_rating
      FROM courses c
      LEFT JOIN ratings r ON r.course_id = c.id
      ORDER BY c.updated_at DESC
    `).all();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get single course with modules and lessons
function getCourse(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const modules = db.prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY order_index').all(id);
    modules.forEach(mod => {
      mod.lessons = db.prepare('SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index').all(mod.id);
      mod.resources = db.prepare('SELECT * FROM resources WHERE module_id = ? ORDER BY name').all(mod.id);
    });

    const rating = db.prepare('SELECT * FROM ratings WHERE course_id = ?').get(id);
    const tags = db.prepare('SELECT name FROM tags WHERE course_id = ?').all(id).map(t => t.name);

    res.json({ ...course, modules, rating: rating?.rating || 0, review: rating?.review || '', tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Delete course
function deleteCourse(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    db.prepare('DELETE FROM courses WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Update course (name, description, tags)
function updateCourse(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, description, tags } = req.body;
    db.prepare('UPDATE courses SET name = ?, description = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name, description, JSON.stringify(tags || []), id);

    // Update tags table
    db.prepare('DELETE FROM tags WHERE course_id = ?').run(id);
    (tags || []).forEach(tag => {
      db.prepare('INSERT INTO tags (course_id, name) VALUES (?, ?)').run(id, tag);
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Rate course
function rateCourse(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const { rating, review } = req.body;
    db.prepare(`
      INSERT INTO ratings (course_id, rating, review) VALUES (?, ?, ?)
      ON CONFLICT(course_id) DO UPDATE SET rating = excluded.rating, review = excluded.review, updated_at = CURRENT_TIMESTAMP
    `).run(id, rating, review || '');
    db.prepare('UPDATE courses SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(rating, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Rescan course folder
async function rescanCourse(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Delete existing modules/lessons (cascade)
    db.prepare('DELETE FROM modules WHERE course_id = ?').run(id);

    const scanned = scanFolder(course.folder_path);

    db.prepare('UPDATE courses SET total_modules = ?, total_lessons = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(scanned.total_modules, scanned.total_lessons, id);

    const insertAll = db.transaction(() => {
      let globalLessonIndex = 0;
      scanned.modules.forEach((mod, modIdx) => {
        const modResult = db.prepare(`
          INSERT INTO modules (course_id, name, folder_path, order_index, total_lessons, is_unlocked)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, mod.name, mod.folder_path, mod.order_index, mod.lessons.length, modIdx === 0 ? 1 : 0);
        const moduleId = modResult.lastInsertRowid;

        mod.lessons.forEach((lesson, lesIdx) => {
          const isFirst = globalLessonIndex === 0;
          db.prepare(`
            INSERT INTO lessons (module_id, course_id, name, file_path, file_name, order_index, is_unlocked, is_current)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(moduleId, id, lesson.name, lesson.file_path, lesson.file_name, lesson.order_index, 1, isFirst ? 1 : 0);
          globalLessonIndex++;
        });
      });
    });
    insertAll();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Upload custom thumbnail for a course
async function uploadThumbnail(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (!req.files || !req.files.thumbnail) {
      return res.status(400).json({ error: 'No thumbnail file uploaded' });
    }

    const file = req.files.thumbnail;
    const ext = path.extname(file.name).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowed.includes(ext)) {
      return res.status(400).json({ error: 'Only image files allowed (jpg, png, webp)' });
    }

    const uploadsDir = path.join(__dirname, '../../../uploads/thumbnails');
    fs.ensureDirSync(uploadsDir);
    const destFile = path.join(uploadsDir, `course_${id}${ext}`);
    await file.mv(destFile);

    const thumbUrl = `/uploads/thumbnails/course_${id}${ext}`;
    db.prepare('UPDATE courses SET thumbnail = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(thumbUrl, id);

    res.json({ success: true, thumbnail: thumbUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Unlock all lessons in a course
function unlockAllLessons(req, res) {
  try {
    const db = getDb();
    const { id } = req.params;
    db.prepare('UPDATE lessons SET is_unlocked = 1 WHERE course_id = ?').run(id);
    db.prepare('UPDATE modules SET is_unlocked = 1 WHERE course_id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { importCourse, getCourses, getCourse, deleteCourse, updateCourse, rateCourse, rescanCourse, uploadThumbnail, unlockAllLessons };
