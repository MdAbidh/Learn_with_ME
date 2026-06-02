const fs = require('fs-extra');
const path = require('path');
const { naturalSortBy } = require('../utils/naturalSort');

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.flv', '.ts', '.m2ts', '.mts'];
const RESOURCE_EXTENSIONS = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.7z', '.txt', '.md'];
const THUMBNAIL_NAMES = ['cover.jpg', 'cover.png', 'thumbnail.jpg', 'thumbnail.png', 'poster.jpg', 'poster.png'];

function isVideo(filename) {
  return VIDEO_EXTENSIONS.includes(path.extname(filename).toLowerCase());
}

function isResource(filename) {
  return RESOURCE_EXTENSIONS.includes(path.extname(filename).toLowerCase());
}

function cleanName(filename) {
  // Keep the original name without extension — preserve numbering for proper ordering
  return path.basename(filename, path.extname(filename)).trim();
}

function findThumbnail(folderPath) {
  for (const name of THUMBNAIL_NAMES) {
    const full = path.join(folderPath, name);
    if (fs.existsSync(full)) return full;
  }
  // Search one level deep
  try {
    const entries = fs.readdirSync(folderPath);
    for (const entry of entries) {
      const entryPath = path.join(folderPath, entry);
      const stat = fs.statSync(entryPath);
      if (!stat.isDirectory()) {
        const ext = path.extname(entry).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return entryPath;
      }
    }
  } catch (e) {}
  return null;
}

function scanFolder(folderPath) {
  const courseName = path.basename(folderPath);
  const thumbnail = findThumbnail(folderPath);
  const modules = [];

  let entries;
  try {
    entries = fs.readdirSync(folderPath);
  } catch (e) {
    throw new Error(`Cannot read folder: ${folderPath}`);
  }

  const sortedEntries = naturalSortBy(entries, e => e);

  // Check for videos directly in root (flat course)
  const rootVideos = sortedEntries.filter(e => {
    try {
      const full = path.join(folderPath, e);
      return fs.statSync(full).isFile() && isVideo(e);
    } catch { return false; }
  });

  const rootResources = sortedEntries.filter(e => {
    try {
      const full = path.join(folderPath, e);
      return fs.statSync(full).isFile() && isResource(e);
    } catch { return false; }
  });

  const subDirs = sortedEntries.filter(e => {
    try {
      const full = path.join(folderPath, e);
      return fs.statSync(full).isDirectory();
    } catch { return false; }
  });

  // If root has videos, create a default module
  if (rootVideos.length > 0) {
    const lessons = rootVideos.map((v, idx) => ({
      name: cleanName(v),
      file_path: path.join(folderPath, v),
      file_name: v,
      order_index: idx,
    }));
    const resources = rootResources.map(r => ({
      name: cleanName(r),
      file_path: path.join(folderPath, r),
      file_type: path.extname(r).toLowerCase().replace('.', ''),
      file_size: getFileSize(path.join(folderPath, r)),
    }));
    modules.push({
      name: courseName,
      folder_path: folderPath,
      order_index: 0,
      lessons,
      resources,
    });
  }

  // Process subdirectories as modules
  subDirs.forEach((dir, idx) => {
    const dirPath = path.join(folderPath, dir);
    const moduleData = scanModuleFolder(dirPath, idx + (rootVideos.length > 0 ? 1 : 0));
    if (moduleData.lessons.length > 0) {
      modules.push(moduleData);
    }
  });

  return {
    name: courseName,
    folder_path: folderPath,
    thumbnail,
    modules,
    total_lessons: modules.reduce((sum, m) => sum + m.lessons.length, 0),
    total_modules: modules.length,
  };
}

function scanModuleFolder(folderPath, orderIndex) {
  const moduleName = path.basename(folderPath);
  const lessons = [];
  const resources = [];

  let entries;
  try {
    entries = fs.readdirSync(folderPath);
  } catch (e) {
    return { name: moduleName, folder_path: folderPath, order_index: orderIndex, lessons: [], resources: [] };
  }

  const sorted = naturalSortBy(entries, e => e);

  sorted.forEach((entry, idx) => {
    const fullPath = path.join(folderPath, entry);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        if (isVideo(entry)) {
          lessons.push({
            name: cleanName(entry),
            file_path: fullPath,
            file_name: entry,
            order_index: idx,
          });
        } else if (isResource(entry)) {
          resources.push({
            name: cleanName(entry),
            file_path: fullPath,
            file_type: path.extname(entry).toLowerCase().replace('.', ''),
            file_size: stat.size,
          });
        }
      }
      // Recursively scan nested subdirs for videos
      if (stat.isDirectory()) {
        const nested = scanModuleFolder(fullPath, idx);
        lessons.push(...nested.lessons);
        resources.push(...nested.resources);
      }
    } catch (e) {}
  });

  return {
    name: moduleName,
    folder_path: folderPath,
    order_index: orderIndex,
    lessons: naturalSortBy(lessons, l => l.file_name),
    resources,
  };
}

function getFileSize(filePath) {
  try { return fs.statSync(filePath).size; } catch { return 0; }
}

module.exports = { scanFolder };
