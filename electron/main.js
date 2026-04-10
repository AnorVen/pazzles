const path = require("node:path");
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const {
  clearScores,
  exportScores,
  getScores,
  saveScore,
} = require("./database.js");

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: "#f4f7f8",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "index.html"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

ipcMain.handle("app:close", () => {
  app.quit();
});

ipcMain.handle("scores:save", (_, score) => {
  return saveScore(score);
});

ipcMain.handle("scores:list", (_, limit, sortMode) => {
  return getScores(limit, sortMode);
});

ipcMain.handle("scores:clear", () => {
  clearScores();
  return true;
});

ipcMain.handle("scores:export", (_, sortMode) => {
  return exportScores(sortMode);
});

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
