const path = require('path');
const fs = require('fs-extra');

const UPLOADS_DIR = path.join(__dirname, '../../../uploads/thumbnails');

// Generate a simple SVG thumbnail with course initials and gradient
function generateSvgThumbnail(courseName) {
  const initials = courseName
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  const gradients = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a18cd1', '#fbc2eb'],
    ['#fccb90', '#d57eeb'],
    ['#a1c4fd', '#c2e9fb'],
  ];

  const idx = courseName.charCodeAt(0) % gradients.length;
  const [c1, c2] = gradients[idx];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/>
      <stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient>
  </defs>
  <rect width="320" height="180" fill="url(#g)" rx="8"/>
  <text x="160" y="100" font-family="Arial,sans-serif" font-size="64" font-weight="bold"
    fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.9">${initials}</text>
  <text x="160" y="155" font-family="Arial,sans-serif" font-size="13" fill="white"
    text-anchor="middle" opacity="0.75">${courseName.substring(0, 35)}</text>
</svg>`;

  return svg;
}

async function ensureThumbnail(courseId, courseName, sourcePath) {
  await fs.ensureDir(UPLOADS_DIR);
  const destFile = path.join(UPLOADS_DIR, `course_${courseId}.svg`);

  if (sourcePath && fs.existsSync(sourcePath)) {
    // Copy existing thumbnail
    const ext = path.extname(sourcePath).toLowerCase();
    const destImg = path.join(UPLOADS_DIR, `course_${courseId}${ext}`);
    await fs.copy(sourcePath, destImg);
    return `/uploads/thumbnails/course_${courseId}${ext}`;
  }

  // Generate SVG thumbnail
  const svg = generateSvgThumbnail(courseName);
  await fs.writeFile(destFile, svg, 'utf8');
  return `/uploads/thumbnails/course_${courseId}.svg`;
}

module.exports = { ensureThumbnail };
