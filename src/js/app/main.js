import {
  aboutBackButton,
  clearLeadersButton,
  closeModal,
  exitButton,
  exportLeadersButton,
  gameModeInputs,
  gameSettingsButton,
  hintButton,
  imageInput,
  howToPlayBackButton,
  leadersBackButton,
  leadersSortSelect,
  menuButton,
  menuHint,
  newGameButton,
  openAboutButton,
  openHowToPlayButton,
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
} from "../presentation/dom.js";
import { applyStaticCopy } from "../content/app-copy.js";
import { canExitApp, exitApp } from "../infrastructure/platform/app-api.js";
import {
  handleImageUpload,
  hasLoadedImage,
  orderPieces,
  shufflePieces,
  startPuzzle,
  toggleHintVisibility,
} from "../application/game/game.js";
import { clearLeaders, exportLeaders } from "../presentation/leaders.js";
import { showPage } from "../presentation/navigation.js";
import { refreshLeadersPage } from "../application/results/results.js";
import {
  initializeSettings,
  saveSettings,
  updateModeLabel,
  updateTotalPieces,
} from "../application/settings/settings.js";

initializeSettings();
updateTotalPieces();
applyStaticCopy();

imageInput.addEventListener("change", handleImageUpload);
startButton.addEventListener("click", () => {
  if (!hasLoadedImage()) {
    settingsStatusOutput.textContent = "Сначала загрузите картинку.";
    return;
  }

  showPage("game");
  startPuzzle();
});
hintButton.addEventListener("click", toggleHintVisibility);
orderButton.addEventListener("click", orderPieces);
shuffleButton.addEventListener("click", shufflePieces);
piecesXInput.addEventListener("input", () =>
  updateTotalPieces(piecesXInput, piecesYInput),
);
piecesYInput.addEventListener("input", () =>
  updateTotalPieces(piecesYInput, piecesXInput),
);
gameModeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    updateModeLabel();
  });
});
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
openHowToPlayButton.addEventListener("click", () => {
  showPage("howToPlay");
});
openAboutButton.addEventListener("click", () => {
  showPage("about");
});
howToPlayBackButton.addEventListener("click", () => {
  showPage("menu");
});
aboutBackButton.addEventListener("click", () => {
  showPage("menu");
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
    statusOutput.textContent =
      "Режим браузера не может закрыть окно приложения автоматически.";
  }
});
