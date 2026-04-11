import initSqlJs from "sql.js";

const databaseStorageKey = "html-puzzle-sqljs-db";
const orderByMap = {
  difficulty: "total_pieces DESC, score DESC, elapsed_ms ASC, played_at DESC",
  score: "score DESC, total_pieces DESC, elapsed_ms ASC, played_at DESC",
  time: "elapsed_ms ASC, total_pieces DESC, score DESC, played_at DESC",
  newest: "played_at DESC",
  oldest: "played_at ASC",
  file: "file_name COLLATE NOCASE ASC, played_at DESC",
};

let sqlJsPromise = null;
let database = null;

export async function saveScoreWithSqlJs(score) {
  const db = await getDatabase();
  const statement = db.prepare(`
    INSERT INTO scores (
      played_at,
      cols,
      rows,
      total_pieces,
      elapsed_ms,
      elapsed_label,
      file_name,
      mode,
      score
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  statement.run([
    score.playedAt,
    score.cols,
    score.rows,
    score.totalPieces,
    score.elapsedMs,
    score.elapsedLabel,
    score.fileName,
    score.mode || "calm",
    score.score || 0,
  ]);
  statement.free();
  persistDatabase(db);

  const result = db.exec("SELECT last_insert_rowid() AS id");

  return result[0]?.values[0]?.[0] ?? null;
}

export async function getScoresWithSqlJs(limit = 50, sortMode = "difficulty") {
  const db = await getDatabase();
  const orderByClause = orderByMap[sortMode] || orderByMap.difficulty;
  const statement = db.prepare(`
    SELECT
      id,
      played_at AS playedAt,
      cols,
      rows,
      total_pieces AS totalPieces,
      elapsed_ms AS elapsedMs,
      elapsed_label AS elapsedLabel,
      file_name AS fileName,
      mode,
      score
    FROM scores
    ORDER BY ${orderByClause}
    LIMIT ?
  `);

  statement.bind([limit]);

  const rows = [];

  while (statement.step()) {
    rows.push(statement.getAsObject());
  }

  statement.free();

  return rows;
}

export async function clearScoresWithSqlJs() {
  const db = await getDatabase();

  db.exec("DELETE FROM scores");
  persistDatabase(db);
}

export async function exportScoresWithSqlJs(sortMode = "difficulty") {
  const rows = await getScoresWithSqlJs(5000, sortMode);
  const csv = createCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `puzzle-leaders-${Date.now()}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return {
    canceled: false,
    count: rows.length,
    path: link.download,
  };
}

async function getDatabase() {
  if (database) {
    return database;
  }

  const SQL = await getSqlJs();
  const savedDatabase = localStorage.getItem(databaseStorageKey);

  if (savedDatabase) {
    database = new SQL.Database(base64ToUint8Array(savedDatabase));
  } else {
    database = new SQL.Database();
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      played_at INTEGER NOT NULL,
      cols INTEGER NOT NULL,
      rows INTEGER NOT NULL,
      total_pieces INTEGER NOT NULL,
      elapsed_ms INTEGER NOT NULL,
      elapsed_label TEXT NOT NULL,
      file_name TEXT NOT NULL
    )
  `);
  ensureColumn(database, "mode", "TEXT NOT NULL DEFAULT 'calm'");
  ensureColumn(database, "score", "INTEGER NOT NULL DEFAULT 0");

  return database;
}

function getSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: () => "dist-app/sql-wasm.wasm",
    });
  }

  return sqlJsPromise;
}

function ensureColumn(db, columnName, definition) {
  const pragma = db.exec("PRAGMA table_info(scores)");
  const rows = pragma[0]?.values || [];
  const hasColumn = rows.some((row) => row[1] === columnName);

  if (!hasColumn) {
    db.exec(`ALTER TABLE scores ADD COLUMN ${columnName} ${definition}`);
    persistDatabase(db);
  }
}

function persistDatabase(db) {
  const bytes = db.export();

  localStorage.setItem(databaseStorageKey, uint8ArrayToBase64(bytes));
}

function uint8ArrayToBase64(bytes) {
  let binaryString = "";

  bytes.forEach((byte) => {
    binaryString += String.fromCharCode(byte);
  });

  return window.btoa(binaryString);
}

function base64ToUint8Array(value) {
  const binaryString = window.atob(value);
  const bytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  return bytes;
}

function createCsv(rows) {
  const header = [
    "playedAt",
    "mode",
    "cols",
    "rows",
    "totalPieces",
    "elapsedMs",
    "elapsedLabel",
    "score",
    "fileName",
  ];
  const body = rows.map((row) =>
    [
      row.playedAt,
      row.mode,
      row.cols,
      row.rows,
      row.totalPieces,
      row.elapsedMs,
      row.elapsedLabel,
      row.score,
      row.fileName,
    ]
      .map(escapeCsvValue)
      .join(","),
  );

  return [header.join(","), ...body].join("\n");
}

function escapeCsvValue(value) {
  const normalizedValue = String(value ?? "");
  const escapedValue = normalizedValue.replaceAll('"', '""');

  return `"${escapedValue}"`;
}
