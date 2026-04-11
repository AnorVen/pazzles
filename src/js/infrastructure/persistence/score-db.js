import {
  getScoresFromDesktop,
  saveScoreToDesktop,
} from "../platform/app-api.js";
import {
  clearScoresInDesktop,
  exportScoresFromDesktop,
} from "../platform/app-api.js";
import {
  clearScoresWithSqlJs,
  exportScoresWithSqlJs,
  getScoresWithSqlJs,
  saveScoreWithSqlJs,
} from "./sqljs-fallback.js";

export async function saveScore(score) {
  if (isDesktopDatabaseAvailable()) {
    return saveScoreToDesktop(score);
  }

  return saveScoreWithSqlJs(score);
}

export async function getScores(limit = 50, sortMode = "difficulty") {
  if (isDesktopDatabaseAvailable()) {
    return getScoresFromDesktop(limit, sortMode);
  }

  return getScoresWithSqlJs(limit, sortMode);
}

export async function clearScores() {
  if (isDesktopDatabaseAvailable()) {
    return clearScoresInDesktop();
  }

  return clearScoresWithSqlJs();
}

export async function exportScores(sortMode = "difficulty") {
  if (isDesktopDatabaseAvailable()) {
    return exportScoresFromDesktop(sortMode);
  }

  return exportScoresWithSqlJs(sortMode);
}

function isDesktopDatabaseAvailable() {
  return Boolean(window.desktopBridge && window.desktopBridge.isDesktop);
}
