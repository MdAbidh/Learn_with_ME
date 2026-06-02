const { getDb } = require('../utils/database');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');

const CERT_DIR = path.join(__dirname, '../../../uploads/certificates');

function generateCertificate(req, res) {
  try {
    const db = getDb();
    const { courseId } = req.params;

    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (!course.is_completed) return res.status(400).json({ error: 'Course not completed yet' });

    const existing = db.prepare('SELECT * FROM certificates WHERE course_id = ?').get(courseId);
    if (existing) return res.json(existing);

    const userName = db.prepare("SELECT value FROM settings WHERE key = 'user_name'").get()?.value || 'Learner';
    const certId = `CERT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;
    const totalHours = Math.round((course.total_duration || 0) / 3600 * 10) / 10;

    const result = db.prepare(`
      INSERT INTO certificates (course_id, certificate_id, user_name, course_name, completion_date, total_lessons, total_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(courseId, certId, userName, course.name, course.completion_date || new Date().toISOString(),
      course.total_lessons, totalHours);

    db.prepare('UPDATE courses SET certificate_id = ? WHERE id = ?').run(certId, courseId);

    const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(result.lastInsertRowid);
    res.json(cert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function getCertificate(req, res) {
  try {
    const db = getDb();
    const { courseId } = req.params;
    const cert = db.prepare('SELECT * FROM certificates WHERE course_id = ?').get(courseId);
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    res.json(cert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Generate certificate SVG for download
function downloadCertificate(req, res) {
  try {
    const db = getDb();
    const { certId } = req.params;
    const cert = db.prepare('SELECT * FROM certificates WHERE certificate_id = ?').get(certId);
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });

    const completionDate = new Date(cert.completion_date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="636" viewBox="0 0 900 636">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0c29"/>
      <stop offset="50%" style="stop-color:#302b63"/>
      <stop offset="100%" style="stop-color:#24243e"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f6d365"/>
      <stop offset="100%" style="stop-color:#fda085"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="900" height="636" fill="url(#bg)"/>
  <!-- Border -->
  <rect x="20" y="20" width="860" height="596" fill="none" stroke="url(#gold)" stroke-width="3" rx="12"/>
  <rect x="30" y="30" width="840" height="576" fill="none" stroke="url(#gold)" stroke-width="1" rx="8" opacity="0.5"/>
  <!-- Header -->
  <text x="450" y="100" font-family="Georgia,serif" font-size="14" fill="#fda085" text-anchor="middle" letter-spacing="8">CERTIFICATE OF COMPLETION</text>
  <!-- Star decoration -->
  <text x="450" y="145" font-family="Arial" font-size="36" fill="url(#gold)" text-anchor="middle">★ ★ ★</text>
  <!-- This certifies -->
  <text x="450" y="195" font-family="Georgia,serif" font-size="16" fill="#c9b8e8" text-anchor="middle">This certifies that</text>
  <!-- Name -->
  <text x="450" y="255" font-family="Georgia,serif" font-size="42" font-weight="bold" fill="white" text-anchor="middle">${cert.user_name}</text>
  <!-- Underline -->
  <line x1="200" y1="270" x2="700" y2="270" stroke="url(#gold)" stroke-width="1.5"/>
  <!-- Has completed -->
  <text x="450" y="310" font-family="Georgia,serif" font-size="16" fill="#c9b8e8" text-anchor="middle">has successfully completed the course</text>
  <!-- Course name -->
  <text x="450" y="370" font-family="Georgia,serif" font-size="28" font-weight="bold" fill="url(#gold)" text-anchor="middle">${cert.course_name.substring(0, 50)}</text>
  <!-- Stats -->
  <text x="250" y="440" font-family="Arial,sans-serif" font-size="13" fill="#c9b8e8" text-anchor="middle">Lessons Completed</text>
  <text x="250" y="465" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">${cert.total_lessons}</text>
  <text x="450" y="440" font-family="Arial,sans-serif" font-size="13" fill="#c9b8e8" text-anchor="middle">Learning Hours</text>
  <text x="450" y="465" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">${cert.total_hours}h</text>
  <text x="650" y="440" font-family="Arial,sans-serif" font-size="13" fill="#c9b8e8" text-anchor="middle">Completion Date</text>
  <text x="650" y="465" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${completionDate}</text>
  <!-- Divider -->
  <line x1="150" y1="490" x2="750" y2="490" stroke="#302b63" stroke-width="1"/>
  <!-- Certificate ID -->
  <text x="450" y="520" font-family="monospace" font-size="11" fill="#6b5b95" text-anchor="middle">Certificate ID: ${cert.certificate_id}</text>
  <!-- Footer -->
  <text x="450" y="570" font-family="Arial,sans-serif" font-size="12" fill="#6b5b95" text-anchor="middle">Personal Learning Platform — Issued ${completionDate}</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certId}.svg"`);
    res.send(svg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { generateCertificate, getCertificate, downloadCertificate };
