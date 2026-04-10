const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  isDesktop: true,
  closeApp() {
    return ipcRenderer.invoke("app:close");
  },
  saveScore(score) {
    return ipcRenderer.invoke("scores:save", score);
  },
  getScores(limit, sortMode) {
    return ipcRenderer.invoke("scores:list", limit, sortMode);
  },
  clearScores() {
    return ipcRenderer.invoke("scores:clear");
  },
  exportScores(sortMode) {
    return ipcRenderer.invoke("scores:export", sortMode);
  },
});
