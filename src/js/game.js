import {
  board,
  fileName,
  gameFileName,
  settingsStatusOutput,
  statusOutput,
  winModal,
  winTime,
} from "./dom.js";
import { minPiecesTotal } from "./constants.js";
import { normalizePiecesInputs } from "./inputs.js";
import {
  applyBoardSize,
  calculateBoardSize,
  calculatePuzzleRect,
  createNormalizedImage,
} from "./layout.js";
import {
  configurePuzzleCanvas,
  createHeadbreakerCanvas,
} from "./puzzle-runtime.js";
import { saveWinResult } from "./results.js";
import { formatTime, getElapsedTime, startTimer, stopTimer } from "./timer.js";
import { createHintLayer, resetBoard, setHintVisible } from "./view.js";

let imageUrl = "";
let loadedImage = null;
let normalizedImage = null;
let puzzleCanvas = null;
let isWon = false;
let currentFileName = "Картинка не выбрана";

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

  const { cols, rows } = normalizePiecesInputs();

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

  stopTimer();
  resetBoard();
  setHintVisible(false);
  applyBoardSize(board, boardSize, puzzleRect);
  gameFileName.textContent = currentFileName;

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
  statusOutput.textContent =
    "Пазл готов. Перетаскивайте кусочки и соединяйте соседние.";
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
  statusOutput.textContent = "Кусочки упорядочены.";
}

export function shufflePieces() {
  if (!puzzleCanvas) {
    statusOutput.textContent = "Сначала соберите пазл.";
    return;
  }

  puzzleCanvas.shuffle(0.9);
  puzzleCanvas.redraw();
  isWon = false;
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
  const elapsedMilliseconds = getElapsedTime();
  const elapsedLabel = formatTime(elapsedMilliseconds);
  const { cols, rows } = normalizePiecesInputs();

  winTime.textContent = elapsedLabel;
  winModal.hidden = false;
  void saveWinResult({
    playedAt: Date.now(),
    cols,
    rows,
    totalPieces: cols * rows,
    elapsedMs: elapsedMilliseconds,
    elapsedLabel,
    fileName: currentFileName,
  });
}
