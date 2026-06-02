const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs-extra');

// On Vercel (serverless) only /tmp is writable; fall back to it when the
// normal database directory is not writable.
const DEFAULT_DB_PATH = path.join(__dirname, '../../database/learning_platform.db');
const DB_PATH = (() => {
  try {
    fs.ensureDirSync(path.dirname(DEFAULT_DB_PATH));
    // Quick write test
    const testFile = path.join(path.dirname(DEFAULT_DB_PATH), '.write_test');
    fs.writeFileSync(testFile, '');
    fs.removeSync(testFile);
    return DEFAULT_DB_PATH;
  } catch (e) {
    return '/tmp/learning_platform.db';
  }
})();

const SCHEMA_PATH = (() => {
  // Schema may be next to the db or bundled with the source
  const candidates = [
    path.join(__dirname, '../../database/schema.sql'),
    path.join(process.cwd(), 'learning-platform/backend/database/schema.sql'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
})();

let db = null;       // proxy object (better-sqlite3 compatible API)
let sqlJsDb = null;  // actual sql.js Database instance

// Save DB to disk
function persistDb() {
  if (!sqlJsDb) return;
  try {
    const data = sqlJsDb.export();
    fs.ensureDirSync(path.dirname(DB_PATH));
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    // ignore errors during shutdown
  }
}

// Auto-save every 5 seconds
setInterval(persistDb, 5000);

// Graceful shutdown save
process.on('exit', persistDb);
process.on('SIGINT', () => { persistDb(); process.exit(); });
process.on('SIGTERM', () => { persistDb(); process.exit(); });

// Convert sql.js result to array of objects
function rowsToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

// Wrap a sql.js statement to mimic better-sqlite3 API
function wrapStatement(sql) {
  return {
    run(...params) {
      const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      sqlJsDb.run(sql, flatParams);
      const info = rowsToObjects(sqlJsDb.exec('SELECT last_insert_rowid() as id, changes() as changes'));
      return {
        lastInsertRowid: info[0]?.id ?? 0,
        changes: info[0]?.changes ?? 0,
      };
    },
    get(...params) {
      const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const result = sqlJsDb.exec(sql, flatParams);
      const rows = rowsToObjects(result);
      return rows[0] ?? undefined;
    },
    all(...params) {
      const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const result = sqlJsDb.exec(sql, flatParams);
      return rowsToObjects(result);
    },
  };
}

// Mimic better-sqlite3 Database object
function createDbProxy() {
  return {
    prepare(sql) {
      return wrapStatement(sql);
    },
    exec(sql) {
      sqlJsDb.run(sql);
    },
    pragma(pragmaStr) {
      try { sqlJsDb.run(`PRAGMA ${pragmaStr}`); } catch (e) { /* ignore */ }
    },
    transaction(fn) {
      return function (...args) {
        sqlJsDb.run('BEGIN');
        try {
          const result = fn(...args);
          sqlJsDb.run('COMMIT');
          persistDb();
          return result;
        } catch (err) {
          sqlJsDb.run('ROLLBACK');
          throw err;
        }
      };
    },
    close() {
      persistDb();
      sqlJsDb.close();
    },
  };
}

function getDb() {
  if (!db) throw new Error('Database not initialized yet. Call initDb() first.');
  return db;
}

async function initDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlJsDb = new SQL.Database(fileBuffer);
  } else {
    sqlJsDb = new SQL.Database();
  }

  db = createDbProxy();

  // Apply pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  // Initialize schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  persistDb();
  console.log('✅ Database initialized at', DB_PATH);
  return db;
}

module.exports = { getDb, initDb };
