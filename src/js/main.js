import {
  clearLeadersButton,
  closeModal,
  exitButton,
  exportLeadersButton,
  gameSettingsButton,
  hintButton,
  imageInput,
  leadersBackButton,
  leadersSortSelect,
  menuButton,
  menuHint,
  newGameButton,
  openLeadersButton,
  openLeadersFromModalButton,
  openSettingsButton,
  orderButton,
  piecesXInput,
  piecesYInput,
  refreshLeadersButton,
  saveSettingsButton,
  shuffleButton,
  settingsBackButton,
  settingsStatusOutput,
  startButton,
  statusOutput,
  winModal,
} from "./dom.js";
import { canExitApp, exitApp } from "./app-api.js";
import {
  getLoadedImage,
  handleImageUpload,
  hasLoadedImage,
  orderPieces,
  shufflePieces,
  startPuzzle,
} from "./game.js";
import { clearLeaders, exportLeaders } from "./leaders.js";
import { showPage } from "./navigation.js";
import { refreshLeadersPage } from "./results.js";
import {
  initializeSettings,
  saveSettings,
  updateTotalPieces,
} from "./settings.js";
import { toggleHint } from "./view.js";

initializeSettings();
updateTotalPieces();

imageInput.addEventListener("change", handleImageUpload);
startButton.addEventListener("click", () => {
  if (!hasLoadedImage()) {
    settingsStatusOutput.textContent = "Сначала загрузите картинку.";
    return;
  }

  showPage("game");
  startPuzzle();
});
hintButton.addEventListener("click", () => {
  toggleHint(getLoadedImage(), statusOutput);
});
orderButton.addEventListener("click", orderPieces);
shuffleButton.addEventListener("click", shufflePieces);
piecesXInput.addEventListener("input", () =>
  updateTotalPieces(piecesXInput, piecesYInput),
);
piecesYInput.addEventListener("input", () =>
  updateTotalPieces(piecesYInput, piecesXInput),
);
saveSettingsButton.addEventListener("click", saveSettings);
closeModal.addEventListener("click", () => {
  winModal.hidden = true;
});
openLeadersFromModalButton.addEventListener("click", async () => {
  winModal.hidden = true;
  showPage("leaders");
  await refreshLeadersPage();
});
newGameButton.addEventListener("click", () => {
  showPage("settings");
});
openSettingsButton.addEventListener("click", () => {
  showPage("settings");
});
settingsBackButton.addEventListener("click", () => {
  showPage("menu");
});
menuButton.addEventListener("click", () => {
  showPage("menu");
});
gameSettingsButton.addEventListener("click", () => {
  showPage("settings");
});
openLeadersButton.addEventListener("click", async () => {
  showPage("leaders");
  await refreshLeadersPage();
});
leadersBackButton.addEventListener("click", () => {
  showPage("menu");
});
refreshLeadersButton.addEventListener("click", async () => {
  await refreshLeadersPage();
});
leadersSortSelect.addEventListener("change", async () => {
  await refreshLeadersPage();
});
exportLeadersButton.addEventListener("click", async () => {
  await exportLeaders();
});
clearLeadersButton.addEventListener("click", async () => {
  const isConfirmed = window.confirm(
    "Удалить все результаты из локальной базы лидеров?",
  );

  if (!isConfirmed) {
    return;
  }

  await clearLeaders();
});

if (!canExitApp()) {
  exitButton.disabled = true;
  exitButton.title = "Кнопка выхода доступна только в Electron-приложении.";
}

exitButton.addEventListener("click", () => {
  const didClose = exitApp();

  if (!didClose) {
    menuHint.textContent =
      "Кнопка выхода работает только внутри Electron-приложения.";
  }
});
