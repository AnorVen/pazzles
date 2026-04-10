export function canExitApp() {
  return Boolean(window.desktopBridge && window.desktopBridge.isDesktop);
}

export function exitApp() {
  if (!canExitApp()) {
    return false;
  }

  window.desktopBridge.closeApp();
  return true;
}

export function saveScoreToDesktop(score) {
  return window.desktopBridge.saveScore(score);
}

export function getScoresFromDesktop(limit, sortMode) {
  return window.desktopBridge.getScores(limit, sortMode);
}

export function clearScoresInDesktop() {
  return window.desktopBridge.clearScores();
}

export function exportScoresFromDesktop(sortMode) {
  return window.desktopBridge.exportScores(sortMode);
}
