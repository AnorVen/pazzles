export function calculateBoardSize() {
  const toolbar = document.querySelector(".gameToolbar");
  const workspace = document.querySelector(".workspace");
  const board = document.querySelector(".board");
  const status = workspace?.querySelector(".status");
  const toolbarHeight = toolbar ? toolbar.getBoundingClientRect().height : 96;
  const workspaceRect = workspace?.getBoundingClientRect();
  const boardRect = board?.getBoundingClientRect();
  const statusRect = status?.getBoundingClientRect();
  const workspaceStyles = workspace ? window.getComputedStyle(workspace) : null;
  const rowGap = workspaceStyles
    ? parseFloat(workspaceStyles.rowGap || "0")
    : 0;
  const fallbackWidth = Math.max(300, window.innerWidth - 32);
  const fallbackHeight = Math.max(260, window.innerHeight - toolbarHeight - 32);
  const width = boardRect?.width
    ? Math.floor(boardRect.width)
    : workspaceRect
      ? Math.floor(workspaceRect.width)
      : fallbackWidth;
  const height = boardRect?.height
    ? Math.floor(boardRect.height)
    : workspaceRect
      ? Math.floor(
          Math.max(
            260,
            workspaceRect.height - (statusRect?.height || 0) - rowGap,
          ),
        )
      : fallbackHeight;

  return {
    width: Math.max(300, width),
    height: Math.max(260, height),
  };
}

export function calculatePuzzleRect(
  imageWidth,
  imageHeight,
  boardSize,
  imageFitMode = "stretch",
) {
  const safeImageWidth = Math.max(1, Math.round(imageWidth || 1));
  const safeImageHeight = Math.max(1, Math.round(imageHeight || 1));
  const imageRatio = safeImageWidth / safeImageHeight;
  const framePadding = Math.max(
    18,
    Math.min(
      56,
      Math.round(Math.min(boardSize.width, boardSize.height) * 0.06),
    ),
  );
  const sidePadding = Math.max(24, Math.min(96, framePadding * 1.35));
  const verticalPadding = Math.max(18, Math.min(72, framePadding));
  const availableWidth = Math.max(
    1,
    Math.round(Math.max(180, boardSize.width - sidePadding * 2)),
  );
  const availableHeight = Math.max(
    1,
    Math.round(Math.max(160, boardSize.height - verticalPadding * 2)),
  );
  let normalizedWidth = availableWidth;
  let normalizedHeight = Math.round(normalizedWidth / imageRatio);

  // Как у референса: изображение пазла всегда сохраняет свою пропорцию,
  // вписывается в доступную область и центрируется внутри доски.
  if (normalizedHeight > availableHeight) {
    normalizedHeight = availableHeight;
    normalizedWidth = Math.round(normalizedHeight * imageRatio);
  }

  // Параметр сохранён для совместимости, но геометрия пазла всегда строится
  // по contain-модели, чтобы слой подсказки, рамка и детали совпадали.
  void imageFitMode;

  normalizedWidth = Math.max(1, normalizedWidth);
  normalizedHeight = Math.max(1, normalizedHeight);

  return {
    left: Math.round((boardSize.width - normalizedWidth) / 2),
    top: Math.round((boardSize.height - normalizedHeight) / 2),
    width: normalizedWidth,
    height: normalizedHeight,
  };
}

export function buildPuzzleGeometry({
  imageWidth,
  imageHeight,
  boardSize,
  cols,
  rows,
  imageFitMode = "stretch",
}) {
  const puzzleRect = calculatePuzzleRect(
    imageWidth,
    imageHeight,
    boardSize,
    imageFitMode,
  );
  const pieceSize = {
    x: puzzleRect.width / cols,
    y: puzzleRect.height / rows,
  };

  return {
    boardSize,
    puzzleRect,
    pieceSize,
    textureSize: {
      width: Math.max(1, Math.round(puzzleRect.width)),
      height: Math.max(1, Math.round(puzzleRect.height)),
    },
    textureOffset: {
      x: -Math.round(puzzleRect.left),
      y: -Math.round(puzzleRect.top),
    },
  };
}

export function createNormalizedImage(sourceImage, puzzleGeometry) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const { textureSize, textureOffset } = puzzleGeometry;

  if (!context) {
    throw new Error("Не удалось подготовить холст для текстуры пазла.");
  }

  canvas.width = textureSize.width;
  canvas.height = textureSize.height;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

  return {
    content: canvas,
    offset: textureOffset,
    scale: 1,
  };
}

export function formatPuzzleGeometryReport({
  sourceWidth,
  sourceHeight,
  puzzleGeometry,
  textureWidth,
  textureHeight,
}) {
  const { boardSize, puzzleRect, pieceSize, textureOffset } = puzzleGeometry;
  const scaleX = textureWidth > 0 ? puzzleRect.width / textureWidth : 1;
  const scaleY = textureHeight > 0 ? puzzleRect.height / textureHeight : 1;

  return [
    `Исходник ${Math.round(sourceWidth)}x${Math.round(sourceHeight)}`,
    `доска ${Math.round(boardSize.width)}x${Math.round(boardSize.height)}`,
    `кадр ${Math.round(puzzleRect.width)}x${Math.round(puzzleRect.height)} @ ${Math.round(puzzleRect.left)},${Math.round(puzzleRect.top)}`,
    `деталь ${Math.round(pieceSize.x)}x${Math.round(pieceSize.y)}`,
    `текстура ${Math.round(textureWidth)}x${Math.round(textureHeight)}`,
    `offset ${textureOffset.x},${textureOffset.y}`,
    `scale ${scaleX.toFixed(4)}x${scaleY.toFixed(4)}`,
  ].join(" • ");
}

export function applyBoardSize(board, boardSize, puzzleRect) {
  board.style.width = `${Math.round(boardSize.width)}px`;
  board.style.height = `${Math.round(boardSize.height)}px`;
  board.style.setProperty("--puzzle-left", `${puzzleRect.left}px`);
  board.style.setProperty("--puzzle-top", `${puzzleRect.top}px`);
  board.style.setProperty("--puzzle-width", `${puzzleRect.width}px`);
  board.style.setProperty("--puzzle-height", `${puzzleRect.height}px`);
}
