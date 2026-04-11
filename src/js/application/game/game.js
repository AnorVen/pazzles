import {
  closeModal,
  board,
  closeLoseModalButton,
  gameFileName,
  hintButton,
  loseMessage,
  loseModal,
  menuHint,
  menuSelectedImageOutput,
  settingsStatusOutput,
  statusOutput,
  winModal,
  winTime,
} from "../../presentation/dom.js";
import { minPiecesTotal } from "../../domain/settings/constants.js";
import {
  buildWinPayload,
  completeGameplayHud,
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
  getCurrentImageFitMode,
  getCurrentMode,
  getNormalizedPiecesFromInputs,
  setSelectedFileName,
} from "../settings/settings.js";
import {
  configurePuzzleCanvas,
  createHeadbreakerCanvas,
} from "../../infrastructure/puzzle/puzzle-runtime.js";
import { saveWinResult } from "../results/results.js";
import {
  formatTime,
  getActiveTimeLimit,
  getElapsedTime,
  getRemainingTime,
  startTimer,
  stopTimer,
} from "../../shared/time/timer.js";
import {
  createHintLayer,
  resetBoard,
  setHintVisible,
  toggleHint,
} from "../../presentation/view.js";
import {
  getPreparedImageEntry,
  hasImagesInPool,
  prepareRandomImage,
} from "./image-pool.js";
import { getGameMode } from "../../domain/game/game-modes.js";

let imageUrl = "";
let loadedImage = null;
let normalizedImage = null;
let puzzleCanvas = null;
let isWon = false;
let isRoundFinished = false;
let currentFileName = "Картинка не выбрана";
let currentPoolImageId = "";
let hudTimerId = null;
let hasPendingNextPuzzle = false;
let currentPuzzleRect = null;
let currentPieceSize = null;

export function getLoadedImage() {
  return loadedImage;
}

export function hasLoadedImage() {
  return Boolean(loadedImage);
}

export function resetPreparedImageState() {
  loadedImage = null;
  normalizedImage = null;
  currentFileName = "Картинка не выбрана";
  currentPoolImageId = "";
  gameFileName.textContent = currentFileName;
  menuSelectedImageOutput.textContent = "Не выбрана";
  setSelectedFileName(currentFileName);
  notifyPreparedImageChanged();
}

export async function ensurePreparedImage() {
  const preparedEntry = getPreparedImageEntry();

  if (preparedEntry && currentPoolImageId === preparedEntry.id && loadedImage) {
    return true;
  }

  const nextEntry = preparedEntry || prepareRandomImage();

  if (!nextEntry) {
    loadedImage = null;
    currentFileName = "Картинка не выбрана";
    currentPoolImageId = "";
    setSelectedFileName(currentFileName);
    menuSelectedImageOutput.textContent = "Не выбрана";
    settingsStatusOutput.textContent =
      "Пул изображений пуст. Загрузите картинки на стартовом экране.";
    return false;
  }

  try {
    await loadImageEntry(nextEntry, "Подготавливаю картинку из пула...");
    return true;
  } catch {
    return false;
  }
}

export function startPuzzle() {
  if (!loadedImage) {
    settingsStatusOutput.textContent =
      "Сначала загрузите группу картинок и подготовьте партию.";
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
    getCurrentImageFitMode(),
  );
  const pieceSize = {
    x: puzzleRect.width / cols,
    y: puzzleRect.height / rows,
  };
  const mode = getCurrentMode();
  const modeConfig = getGameMode(mode);

  stopTimer();
  stopHudLoop();
  resetBoard();
  setHintVisible(false);
  applyBoardSize(board, boardSize, puzzleRect);
  currentPuzzleRect = puzzleRect;
  currentPieceSize = pieceSize;
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
  setBoardInteractionEnabled(true);

  isWon = false;
  isRoundFinished = false;
  hasPendingNextPuzzle = false;
  closeModal.textContent = "Закрыть";
  loseModal.hidden = true;
  applyModeControls(modeConfig);
  startTimer({ timeLimitMs: modeConfig.timeLimitMs });
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

  if (isRoundFinished) {
    statusOutput.textContent =
      "Партия уже завершена. Начните новую, чтобы снова использовать подсказки.";
    return;
  }

  const mode = getGameMode(getCurrentMode());

  if (!mode.hintsAllowed) {
    statusOutput.textContent =
      "В режиме «Испытание» подсказки недоступны до конца партии.";
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

  if (isRoundFinished) {
    statusOutput.textContent =
      "Партия уже завершена. Запустите новую, чтобы снова двигать детали.";
    return;
  }

  puzzleCanvas.puzzle.disconnect();
  const orderedPieces = [...puzzleCanvas.puzzle.pieces].sort((first, second) =>
    first.metadata.id.localeCompare(second.metadata.id),
  );

  orderedPieces.forEach((piece) => {
    const { x, y } = buildOrderedPosition(piece);
    piece.relocateTo(x, y);
  });
  puzzleCanvas.redraw();
  isWon = false;
  recordGameplayAction("order");
  refreshHud();
  statusOutput.textContent =
    "Кусочки упорядочены рядом с правильными местами, но пазл ещё не собран.";
}

export function shufflePieces() {
  if (!puzzleCanvas) {
    statusOutput.textContent = "Сначала соберите пазл.";
    return;
  }

  if (isRoundFinished) {
    statusOutput.textContent =
      "Партия уже завершена. Запустите новую, чтобы снова перемешивать детали.";
    return;
  }

  puzzleCanvas.shuffle(0.9);
  puzzleCanvas.redraw();
  isWon = false;
  recordGameplayAction("shuffle");
  refreshHud();
  statusOutput.textContent = "Кусочки перемешаны.";
}

export function handleWinModalClose() {
  winModal.hidden = true;

  if (!hasPendingNextPuzzle) {
    return;
  }

  hasPendingNextPuzzle = false;
  closeModal.textContent = "Закрыть";
  startPuzzle();
}

export function handleLoseModalClose() {
  loseModal.hidden = true;
  closeLoseModalButton.blur();
}

function createCanvasHost() {
  board.append(createHintLayer(imageUrl));

  const canvasHost = document.createElement("div");
  canvasHost.id = "puzzleCanvas";
  canvasHost.className = "puzzleCanvas";
  board.append(canvasHost);
}

function checkWin() {
  if (
    !puzzleCanvas ||
    isWon ||
    isRoundFinished ||
    !puzzleCanvas.puzzle.connected
  ) {
    return;
  }

  isWon = true;
  isRoundFinished = true;
  stopTimer();
  stopHudLoop();
  setBoardInteractionEnabled(true);
  void finalizeWin();
}

function refreshHud() {
  if (!puzzleCanvas) {
    return;
  }

  const elapsedMs = getElapsedTime();

  updateGameplayHud(puzzleCanvas, elapsedMs);

  const timeLimitMs = getActiveTimeLimit();

  if (
    timeLimitMs !== null &&
    !isRoundFinished &&
    (getRemainingTime() ?? 0) <= 0
  ) {
    handleTimeLimitReached(timeLimitMs);
  }
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

async function finalizeWin() {
  const elapsedMilliseconds = getElapsedTime();
  const elapsedLabel = formatTime(elapsedMilliseconds);
  const completedFileName = currentFileName;
  const completedImageId = currentPoolImageId;

  completeGameplayHud(elapsedMilliseconds);
  const winPayload = buildWinPayload({
    elapsedMs: elapsedMilliseconds,
    elapsedLabel,
    fileName: completedFileName,
  });

  winTime.textContent = elapsedLabel;
  winModal.hidden = false;
  await saveWinResult(winPayload);
  await prepareNextImageFromPool(completedImageId);
}

function handleTimeLimitReached(timeLimitMs) {
  isRoundFinished = true;
  stopTimer();
  stopHudLoop();
  setHintVisible(false);
  setBoardInteractionEnabled(false);
  loseMessage.textContent =
    "Лимит режима «Испытание» исчерпан. Текущая партия остановлена, можно вернуться в меню и начать заново.";
  loseModal.hidden = false;
  statusOutput.textContent =
    `Время вышло на отметке ${formatTime(timeLimitMs)}. Партия остановлена до нового запуска.`;
}

async function prepareNextImageFromPool(previousImageId) {
  if (!hasImagesInPool()) {
    hasPendingNextPuzzle = false;
    return;
  }

  const nextEntry = prepareRandomImage({
    avoidImageId: previousImageId,
  });

  if (!nextEntry) {
    hasPendingNextPuzzle = false;
    return;
  }

  try {
    await loadImageEntry(
      nextEntry,
      "Победа! Подготавливаю следующую картинку из пула...",
    );
    hasPendingNextPuzzle = true;
    closeModal.textContent = "Следующая партия";
    menuHint.textContent =
      "Следующая картинка уже подготовлена. Можно запускать новую партию.";
    statusOutput.textContent =
      "Пазл собран. Следующая картинка из пула уже подготовлена.";
    notifyPreparedImageChanged();
  } catch {
    hasPendingNextPuzzle = false;
    statusOutput.textContent =
      "Пазл собран, но следующую картинку из пула подготовить не удалось.";
  }
}

function loadImageEntry(entry, loadingText) {
  currentFileName = entry.name;
  currentPoolImageId = entry.id;
  imageUrl = entry.src;
  gameFileName.textContent = entry.name;
  menuSelectedImageOutput.textContent = entry.name;
  setSelectedFileName(entry.name);
  settingsStatusOutput.textContent = loadingText;

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      loadedImage = image;
      normalizedImage = null;
      settingsStatusOutput.textContent =
        "Картинка из пула подготовлена. Можно начинать игру.";
      notifyPreparedImageChanged();
      resolve(true);
    };
    image.onerror = () => {
      settingsStatusOutput.textContent =
        "Не удалось подготовить картинку из пула.";
      reject(new Error("Не удалось загрузить картинку из пула."));
    };
    image.src = entry.src;
  });
}

function notifyPreparedImageChanged() {
  window.dispatchEvent(new CustomEvent("pool:prepared-image-changed"));
}

function applyModeControls(mode) {
  hintButton.disabled = !mode.hintsAllowed;
  hintButton.title = mode.hintsAllowed
    ? ""
    : "Подсказки отключены в режиме «Испытание».";
}

function setBoardInteractionEnabled(enabled) {
  const canvasElement = board.querySelector("canvas");

  if (canvasElement) {
    canvasElement.style.pointerEvents = enabled ? "auto" : "none";
  }
}

function buildOrderedPosition(piece) {
  const targetPosition = piece.metadata.targetPosition;

  if (!currentPieceSize || !currentPuzzleRect) {
    return targetPosition;
  }

  const colShift = (piece.metadata.col % 2 === 0 ? -1 : 1) * currentPieceSize.x * 0.22;
  const rowShift = (piece.metadata.row % 2 === 0 ? -1 : 1) * currentPieceSize.y * 0.22;
  const minX = currentPuzzleRect.left + currentPieceSize.x / 2;
  const maxX =
    currentPuzzleRect.left + currentPuzzleRect.width - currentPieceSize.x / 2;
  const minY = currentPuzzleRect.top + currentPieceSize.y / 2;
  const maxY =
    currentPuzzleRect.top + currentPuzzleRect.height - currentPieceSize.y / 2;

  return {
    x: clamp(targetPosition.x + colShift, minX, maxX),
    y: clamp(targetPosition.y + rowShift, minY, maxY),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
