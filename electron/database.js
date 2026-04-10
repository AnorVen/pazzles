const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { app, dialog } = require("electron");

let database = null;

function saveScore(score) {
  const statement = getDatabase().prepare(`
    INSERT INTO scores (
      played_at,
      cols,
      rows,
      total_pieces,
      elapsed_ms,
      elapsed_label,
      file_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = statement.run(
    score.playedAt,
    score.cols,
    score.rows,
    score.totalPieces,
    score.elapsedMs,
    score.elapsedLabel,
    score.fileName,
  );

  return Number(result.lastInsertRowid);
}

function getScores(limit = 50, sortMode = "difficulty") {
  const statement = getDatabase().prepare(`
    SELECT
      id,
      played_at AS playedAt,
      cols,
      rows,
      total_pieces AS totalPieces,
      elapsed_ms AS elapsedMs,
      elapsed_label AS elapsedLabel,
      file_name AS fileName
    FROM scores
    ORDER BY ${getOrderByClause(sortMode)}
    LIMIT ?
  `);

  return statement.all(limit);
}

function clearScores() {
  getDatabase().exec("DELETE FROM scores");
}

async function exportScores(sortMode = "difficulty") {
  const rows = getScores(5000, sortMode);
  const exportPath = await chooseExportPath();

  if (!exportPath) {
    return { canceled: true };
  }

  const csv = createCsv(rows);

  fs.writeFileSync(exportPath, csv, "utf8");

  return {
    canceled: false,
    path: exportPath,
    count: rows.length,
  };
}

function getDatabase() {
  if (database) {
    return database;
  }

  const databasePath = getDatabasePath();
  database = new DatabaseSync(databasePath);
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

  return database;
}

function getDatabasePath() {
  const userDataDirectory = app.getPath("userData");

  fs.mkdirSync(userDataDirectory, { recursive: true });

  return path.join(userDataDirectory, "scores.sqlite");
}

function getOrderByClause(sortMode) {
  const orderByMap = {
    difficulty: "total_pieces DESC, elapsed_ms ASC, played_at DESC",
    time: "elapsed_ms ASC, total_pieces DESC, played_at DESC",
    newest: "played_at DESC",
    oldest: "played_at ASC",
    file: "file_name COLLATE NOCASE ASC, played_at DESC",
  };

  return orderByMap[sortMode] || orderByMap.difficulty;
}

async function chooseExportPath() {
  const defaultPath = path.join(
    app.getPath("documents"),
    `puzzle-leaders-${Date.now()}.csv`,
  );
  const result = await dialog.showSaveDialog({
    title: "Сохранить таблицу лидеров",
    defaultPath,
    filters: [
      {
        name: "CSV",
        extensions: ["csv"],
      },
    ],
  });

  if (result.canceled) {
    return null;
  }

  return result.filePath;
}

function createCsv(rows) {
  const header = [
    "playedAt",
    "cols",
    "rows",
    "totalPieces",
    "elapsedMs",
    "elapsedLabel",
    "fileName",
  ];
  const body = rows.map((row) =>
    [
      row.playedAt,
      row.cols,
      row.rows,
      row.totalPieces,
      row.elapsedMs,
      row.elapsedLabel,
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

module.exports = {
  clearScores,
  exportScores,
  getScores,
  saveScore,
};
