import {
  board,
  fileName,
  gameFileName,
  settingsStatusOutput,
  statusOutput,
  winModal,
  winTime,
} from "../../presentation/dom.js";
import { minPiecesTotal } from "../../domain/settings/constants.js";
import {
  buildWinPayload,
  initializeGameplaySession,
  recordGameplayAction,
  updateGameplayHud,
} from "./gameplay-stats.js";
import {
  applyBoardSize,
  calculateBoardSize,
  calculatePuzzleRect,
  createNormalizedImage,
} from "../../infrastructure/layout/layout.js";
import {
  getCurrentMode,
  getNormalizedPiecesFromInputs,
} from "../settings/settings.js";
import {
  configurePuzzleCanvas,
  createHeadbreakerCanvas,
} from "../../infrastructure/puzzle/puzzle-runtime.js";
import { saveWinResult } from "../results/results.js";
import {
  formatTime,
  getElapsedTime,
  startTimer,
  stopTimer,
} from "../../shared/time/timer.js";
import {
  createHintLayer,
  resetBoard,
  setHintVisible,
  toggleHint,
} from "../../presentation/view.js";

let imageUrl = "";
let loadedImage = null;
let normalizedImage = null;
let puzzleCanvas = null;
let isWon = false;
let currentFileName = "Картинка не выбрана";
let hudTimerId = null;

export function getLoadedImage() {
  return loadedImage;
}

export function hasLoadedImage() {
  return Boolean(loadedImage);
}

export function handleImageUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  if (imageUrl) {
    URL.revokeObjectURL(imageUrl);
  }

  imageUrl = URL.createObjectURL(file);
  currentFileName = file.name;
  fileName.textContent = file.name;
  gameFileName.textContent = file.name;
  settingsStatusOutput.textContent = "Загружаю картинку...";

  const image = new Image();
  image.onload = () => {
    loadedImage = image;
    normalizedImage = null;
    settingsStatusOutput.textContent =
      "Картинка загружена. Можно начинать игру.";
  };
  image.onerror = () => {
    settingsStatusOutput.textContent = "Не удалось загрузить картинку.";
  };
  image.src = imageUrl;
}

export function startPuzzle() {
  if (!loadedImage) {
    settingsStatusOutput.textContent = "Сначала загрузите картинку.";
    return;
  }

  if (!window.headbreaker) {
    settingsStatusOutput.textContent =
      "Библиотека headbreaker не загрузилась. Проверьте vendor/headbreaker.js.";
    return;
  }

  const { cols, rows } = getNormalizedPiecesFromInputs();

  if (cols * rows < minPiecesTotal) {
    settingsStatusOutput.textContent =
      "Пазл 1 × 1 недоступен. Выберите хотя бы 2 элемента.";
    return;
  }

  const boardSize = calculateBoardSize();
  const puzzleRect = calculatePuzzleRect(
    loadedImage.naturalWidth,
    loadedImage.naturalHeight,
    boardSize,
  );
  const pieceSize = {
    x: puzzleRect.width / cols,
    y: puzzleRect.height / rows,
  };
  const mode = getCurrentMode();

  stopTimer();
  stopHudLoop();
  resetBoard();
  setHintVisible(false);
  applyBoardSize(board, boardSize, puzzleRect);
  gameFileName.textContent = currentFileName;
  initializeGameplaySession({
    cols,
    rows,
    fileName: currentFileName,
    mode,
  });

  normalizedImage = createNormalizedImage(loadedImage, boardSize, puzzleRect);

  createCanvasHost();
  puzzleCanvas = createHeadbreakerCanvas(
    boardSize,
    puzzleRect,
    pieceSize,
    { cols, rows },
    normalizedImage,
  );
  configurePuzzleCanvas(
    puzzleCanvas,
    cols,
    rows,
    pieceSize,
    puzzleRect,
    checkWin,
  );

  isWon = false;
  startTimer();
  startHudLoop();
  updateGameplayHud(puzzleCanvas, 0);
  statusOutput.textContent =
    "Партия началась. Собирайте фрагменты и следите за темпом.";
}

export function toggleHintVisibility() {
  if (!loadedImage) {
    statusOutput.textContent = "Сначала загрузите картинку.";
    return;
  }

  const wasVisible = board.classList.contains("showHint");

  toggleHint(loadedImage, statusOutput);

  if (!wasVisible && board.classList.contains("showHint")) {
    recordGameplayAction("hint");
    refreshHud();
    statusOutput.textContent = "Подсказка включена.";
  }
}

export function orderPieces() {
  if (!puzzleCanvas) {
    statusOutput.textContent = "Сначала соберите пазл.";
    return;
  }

  puzzleCanvas.puzzle.disconnect();
  puzzleCanvas.puzzle.pieces.forEach((piece) => {
    const { x, y } = piece.metadata.targetPosition;
    piece.relocateTo(x, y);
  });
  puzzleCanvas.redraw();
  isWon = false;
  recordGameplayAction("order");
  refreshHud();
  statusOutput.textContent = "Кусочки разложены по местам.";
}

export function shufflePieces() {
  if (!puzzleCanvas) {
    statusOutput.textContent = "Сначала соберите пазл.";
    return;
  }

  puzzleCanvas.shuffle(0.9);
  puzzleCanvas.redraw();
  isWon = false;
  recordGameplayAction("shuffle");
  refreshHud();
  statusOutput.textContent = "Кусочки перемешаны.";
}

function createCanvasHost() {
  board.append(createHintLayer(imageUrl));

  const canvasHost = document.createElement("div");
  canvasHost.id = "puzzleCanvas";
  canvasHost.className = "puzzleCanvas";
  board.append(canvasHost);
}

function checkWin() {
  if (!puzzleCanvas || isWon || !puzzleCanvas.puzzle.connected) {
    return;
  }

  isWon = true;
  stopTimer();
  stopHudLoop();
  const elapsedMilliseconds = getElapsedTime();
  const elapsedLabel = formatTime(elapsedMilliseconds);
  const winPayload = buildWinPayload({
    elapsedMs: elapsedMilliseconds,
    elapsedLabel,
    fileName: currentFileName,
  });

  winTime.textContent = elapsedLabel;
  winModal.hidden = false;
  void saveWinResult(winPayload);
}

function refreshHud() {
  if (!puzzleCanvas) {
    return;
  }

  updateGameplayHud(puzzleCanvas, getElapsedTime());
}

function startHudLoop() {
  stopHudLoop();
  hudTimerId = window.setInterval(() => {
    refreshHud();
  }, 300);
}

function stopHudLoop() {
  if (hudTimerId) {
    window.clearInterval(hudTimerId);
    hudTimerId = null;
  }
}
