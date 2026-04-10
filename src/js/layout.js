export function calculateBoardSize() {
  const toolbar = document.querySelector(".gameToolbar");
  const toolbarHeight = toolbar ? toolbar.getBoundingClientRect().height : 96;

  return {
    width: Math.max(300, window.innerWidth - 32),
    height: Math.max(260, window.innerHeight - toolbarHeight - 32),
  };
}

export function calculatePuzzleRect(imageWidth, imageHeight, boardSize) {
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

export function createNormalizedImage(sourceImage, boardSize, puzzleRect) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const normalizedWidth = Math.round(boardSize.width);
  const normalizedHeight = Math.round(boardSize.height);

  canvas.width = normalizedWidth;
  canvas.height = normalizedHeight;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    sourceImage,
    Math.round(puzzleRect.left),
    Math.round(puzzleRect.top),
    Math.round(puzzleRect.width),
    Math.round(puzzleRect.height),
  );

  return {
    content: canvas,
    offset: { x: 0, y: 0 },
    scale: 1,
  };
}

export function applyBoardSize(board, boardSize, puzzleRect) {
  board.style.width = `${Math.round(boardSize.width)}px`;
  board.style.height = `${Math.round(boardSize.height)}px`;
  board.style.setProperty("--puzzle-left", `${puzzleRect.left}px`);
  board.style.setProperty("--puzzle-top", `${puzzleRect.top}px`);
  board.style.setProperty("--puzzle-width", `${puzzleRect.width}px`);
  board.style.setProperty("--puzzle-height", `${puzzleRect.height}px`);
}
