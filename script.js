const imageInput = document.querySelector("#imageInput");
const fileName = document.querySelector("#fileName");
const piecesXInput = document.querySelector("#piecesX");
const piecesYInput = document.querySelector("#piecesY");
const hintButton = document.querySelector("#hintButton");
const orderButton = document.querySelector("#orderButton");
const shuffleButton = document.querySelector("#shuffleButton");
const startButton = document.querySelector("#startButton");
const board = document.querySelector("#board");
const timerOutput = document.querySelector("#timer");
const statusOutput = document.querySelector("#status");
const winModal = document.querySelector("#winModal");
const winTime = document.querySelector("#winTime");
const closeModal = document.querySelector("#closeModal");

const minPiecesPerSide = 1;
const maxPiecesPerSide = 5000;
const maxPiecesTotal = 5000;

let imageUrl = "";
let loadedImage = null;
let normalizedImage = null;
let puzzleCanvas = null;
let timerId = null;
let startTime = 0;
let isWon = false;
let isHintVisible = false;

imageInput.addEventListener("change", handleImageUpload);
startButton.addEventListener("click", startPuzzle);
hintButton.addEventListener("click", toggleHint);
orderButton.addEventListener("click", orderPieces);
shuffleButton.addEventListener("click", shufflePieces);
piecesXInput.addEventListener("input", () => normalizePiecesInputs(piecesXInput, piecesYInput));
piecesYInput.addEventListener("input", () => normalizePiecesInputs(piecesYInput, piecesXInput));
closeModal.addEventListener("click", () => {
  winModal.hidden = true;
});

function handleImageUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  if (imageUrl) {
    URL.revokeObjectURL(imageUrl);
  }

  imageUrl = URL.createObjectURL(file);
  fileName.textContent = file.name;
  statusOutput.textContent = "Загружаю картинку...";

  const image = new Image();
  image.onload = () => {
    loadedImage = image;
    normalizedImage = null;
    startPuzzle();
  };
  image.onerror = () => {
    statusOutput.textContent = "Не удалось загрузить картинку.";
  };
  image.src = imageUrl;
}

function startPuzzle() {
  if (!loadedImage) {
    statusOutput.textContent = "Сначала загрузите картинку.";
    return;
  }

  if (!window.headbreaker) {
    statusOutput.textContent = "Библиотека headbreaker не загрузилась. Проверьте доступ к интернету и обновите страницу.";
    return;
  }

  const { cols, rows } = normalizePiecesInputs();

  stopTimer();
  resetBoard();
  setHintVisible(false);

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
  normalizedImage = createNormalizedImage(loadedImage, puzzleRect.width, puzzleRect.height);
  const borderFill = {
    x: Math.max(4, pieceSize.x * 0.08),
    y: Math.max(4, pieceSize.y * 0.08),
  };
  const pieceRadius = {
    x: pieceSize.x / 2,
    y: pieceSize.y / 2,
  };

  board.style.width = `${Math.round(boardSize.width)}px`;
  board.style.height = `${Math.round(boardSize.height)}px`;
  board.style.setProperty("--puzzle-left", `${puzzleRect.left}px`);
  board.style.setProperty("--puzzle-top", `${puzzleRect.top}px`);
  board.style.setProperty("--puzzle-width", `${puzzleRect.width}px`);
  board.style.setProperty("--puzzle-height", `${puzzleRect.height}px`);
  board.append(createHintLayer());

  const canvasHost = document.createElement("div");
  canvasHost.id = "puzzleCanvas";
  canvasHost.className = "puzzleCanvas";
  board.append(canvasHost);

  puzzleCanvas = new headbreaker.Canvas("puzzleCanvas", {
    width: boardSize.width,
    height: boardSize.height,
    pieceSize,
    proximity: Math.max(10, Math.min(pieceSize.x, pieceSize.y) * 0.18),
    borderFill,
    strokeWidth: 1.5,
    strokeColor: "rgba(0, 0, 0, 0.45)",
    lineSoftness: 0.28,
    preventOffstageDrag: true,
    image: normalizedImage,
    maxPiecesCount: { x: cols, y: rows },
    puzzleDiameter: { x: puzzleRect.width, y: puzzleRect.height },
    outline: createPuzzleOutline(),
  });

  puzzleCanvas._imageAdjuster = (imageMetadata) => {
    return {
      content: imageMetadata.content,
      scale: 1,
      offset: {
        x: imageMetadata.offset.x,
        y: imageMetadata.offset.y,
      },
    };
  };
  puzzleCanvas.autogenerateWithManufacturer(
    createPuzzleManufacturer(cols, rows, pieceRadius),
  );
  puzzleCanvas.puzzle.translate(puzzleRect.left, puzzleRect.top);
  puzzleCanvas.refill();
  disableImageRepeat();
  puzzleCanvas.puzzle.attachHorizontalConnectionRequirement(areOriginalHorizontalNeighbors);
  puzzleCanvas.puzzle.attachVerticalConnectionRequirement(areOriginalVerticalNeighbors);
  puzzleCanvas.attachSolvedValidator();
  puzzleCanvas.shuffle(0.8);
  puzzleCanvas.draw();

  // Соединенные кусочки должны оставаться одной группой при дальнейшем перетаскивании.
  puzzleCanvas.puzzle.forceConnectionWhileDragging();
  puzzleCanvas.onValid(checkWin);

  startTimer();
  statusOutput.textContent = "Пазл готов. Перетаскивайте кусочки и соединяйте соседние.";
}

function calculateBoardSize() {
  const toolbarHeight = document.querySelector(".toolbar").getBoundingClientRect().height;
  return {
    width: Math.max(300, window.innerWidth - 32),
    height: Math.max(260, window.innerHeight - toolbarHeight - 32),
  };
}

function calculatePuzzleRect(imageWidth, imageHeight, boardSize) {
  const sidePadding = Math.max(24, Math.min(120, boardSize.width * 0.16));
  const verticalPadding = Math.max(16, Math.min(60, boardSize.height * 0.08));
  const maxWidth = Math.max(180, boardSize.width - sidePadding * 2);
  const maxHeight = Math.max(160, boardSize.height - verticalPadding * 2);
  const imageRatio = imageWidth / imageHeight;
  let width = maxWidth;
  let height = width / imageRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * imageRatio;
  }

  return {
    left: (boardSize.width - width) / 2,
    top: (boardSize.height - height) / 2,
    width,
    height,
  };
}

function createNormalizedImage(sourceImage, width, height) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const normalizedWidth = Math.round(width);
  const normalizedHeight = Math.round(height);

  canvas.width = normalizedWidth;
  canvas.height = normalizedHeight;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(sourceImage, 0, 0, normalizedWidth, normalizedHeight);

  return {
    content: canvas,
    offset: { x: 0, y: 0 },
    scale: 1,
  };
}

function createPuzzleManufacturer(cols, rows, pieceRadius) {
  const manufacturer = new headbreaker.Manufacturer();
  const insertsGenerator = getPuzzleGenerator();

  manufacturer.withDimensions(cols, rows);
  manufacturer.withHeadAt(headbreaker.anchor(pieceRadius.x, pieceRadius.y));
  manufacturer.withMetadata(createPieceMetadata(cols, rows));

  if (insertsGenerator) {
    manufacturer.withInsertsGenerator(insertsGenerator);
  }

  return manufacturer;
}

function createPuzzleOutline() {
  if (headbreaker.outline && headbreaker.outline.Rounded) {
    return new headbreaker.outline.Rounded({
      borderLength: 0.3,
      insertDepth: 0.72,
      bezelize: true,
      bezelDepth: 0.08,
    });
  }

  return undefined;
}

function disableImageRepeat() {
  puzzleCanvas.puzzle.pieces.forEach((piece) => {
    const figure = puzzleCanvas.getFigure(piece);

    if (figure && figure.shape && figure.shape.fillPatternRepeat) {
      figure.shape.fillPatternRepeat("no-repeat");
    }
  });
}

function createPieceMetadata(cols, rows) {
  const metadata = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      metadata.push({
        id: `${row}-${col}`,
        row,
        col,
      });
    }
  }

  return metadata;
}

function areOriginalHorizontalNeighbors(firstPiece, secondPiece) {
  const colDistance = Math.abs(firstPiece.metadata.col - secondPiece.metadata.col);
  const isSameRow = firstPiece.metadata.row === secondPiece.metadata.row;

  return isSameRow && colDistance === 1;
}

function areOriginalVerticalNeighbors(firstPiece, secondPiece) {
  const rowDistance = Math.abs(firstPiece.metadata.row - secondPiece.metadata.row);
  const isSameColumn = firstPiece.metadata.col === secondPiece.metadata.col;

  return isSameColumn && rowDistance === 1;
}

function createHintLayer() {
  const hintLayer = document.createElement("div");
  const hintImage = document.createElement("img");

  hintLayer.className = "hintLayer";
  hintImage.src = imageUrl;
  hintImage.alt = "Подсказка исходной картинки";
  hintLayer.append(hintImage);

  return hintLayer;
}

function getPuzzleGenerator() {
  if (headbreaker.generators && headbreaker.generators.random) {
    return headbreaker.generators.random;
  }

  return undefined;
}

function resetBoard() {
  board.innerHTML = "";
  board.classList.remove("showHint");
  winModal.hidden = true;
  isWon = false;
}

function toggleHint() {
  if (!loadedImage) {
    statusOutput.textContent = "Сначала загрузите картинку.";
    return;
  }

  setHintVisible(!isHintVisible);
}

function orderPieces() {
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

function shufflePieces() {
  if (!puzzleCanvas) {
    statusOutput.textContent = "Сначала соберите пазл.";
    return;
  }

  puzzleCanvas.shuffle(0.9);
  puzzleCanvas.redraw();
  isWon = false;
  statusOutput.textContent = "Кусочки перемешаны.";
}

function setHintVisible(isVisible) {
  isHintVisible = isVisible;
  board.classList.toggle("showHint", isHintVisible);
  hintButton.classList.toggle("isActive", isHintVisible);
  hintButton.setAttribute("aria-pressed", String(isHintVisible));
  hintButton.textContent = isHintVisible ? "Скрыть подсказку" : "Показать подсказку";
}

function checkWin() {
  if (!puzzleCanvas || isWon || !puzzleCanvas.puzzle.connected) {
    return;
  }

  isWon = true;
  centerSolvedPuzzle();
  stopTimer();
  winTime.textContent = formatTime(Date.now() - startTime);
  winModal.hidden = false;
  statusOutput.textContent = "Пазл собран.";
}

function centerSolvedPuzzle() {
  const bounds = getPuzzleBounds();

  if (!bounds) {
    return;
  }

  const targetCenterX = puzzleCanvas.width / 2;
  const targetCenterY = puzzleCanvas.height / 2;
  const currentCenterX = bounds.left + bounds.width / 2;
  const currentCenterY = bounds.top + bounds.height / 2;

  puzzleCanvas.puzzle.translate(
    targetCenterX - currentCenterX,
    targetCenterY - currentCenterY,
  );
  puzzleCanvas.redraw();
}

function getPuzzleBounds() {
  if (!puzzleCanvas || !puzzleCanvas.puzzle.pieces.length) {
    return null;
  }

  const anchors = puzzleCanvas.puzzle.pieces.flatMap((piece) => {
    return [
      piece.leftAnchor,
      piece.rightAnchor,
      piece.upAnchor,
      piece.downAnchor,
    ];
  });
  const xs = anchors.map((anchor) => anchor.x);
  const ys = anchors.map((anchor) => anchor.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

function startTimer() {
  startTime = Date.now();
  timerOutput.textContent = "00:00";
  timerId = window.setInterval(() => {
    timerOutput.textContent = formatTime(Date.now() - startTime);
  }, 500);
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function clampNumber(value, min, max) {
  const number = Number.parseInt(value, 10);

  if (Number.isNaN(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, number));
}

function normalizePiecesInputs(changedInput = piecesXInput, pairedInput = piecesYInput) {
  const changedValue = clampNumber(changedInput.value, minPiecesPerSide, maxPiecesPerSide);
  let pairedValue = clampNumber(pairedInput.value, minPiecesPerSide, maxPiecesPerSide);
  const maxPairedValue = Math.max(
    minPiecesPerSide,
    Math.floor(maxPiecesTotal / changedValue),
  );

  if (pairedValue > maxPairedValue) {
    pairedValue = maxPairedValue;
  }

  changedInput.value = changedValue;
  pairedInput.value = pairedValue;

  return {
    cols: Number.parseInt(piecesXInput.value, 10),
    rows: Number.parseInt(piecesYInput.value, 10),
  };
}
