export function calculateBoardSize() {
  const toolbar = document.querySelector(".gameToolbar");
  const workspace = document.querySelector(".workspace");
  const toolbarHeight = toolbar ? toolbar.getBoundingClientRect().height : 96;
  const workspaceRect = workspace?.getBoundingClientRect();
  const width = workspaceRect
    ? Math.floor(workspaceRect.width)
    : Math.max(300, window.innerWidth - 32);
  const height = workspaceRect
    ? Math.floor(
        workspaceRect.height || window.innerHeight - toolbarHeight - 32,
      )
    : Math.max(260, window.innerHeight - toolbarHeight - 32);

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
  const sidePadding = Math.max(24, Math.min(120, boardSize.width * 0.16));
  const verticalPadding = Math.max(16, Math.min(60, boardSize.height * 0.08));
  const availableWidth = Math.max(
    1,
    Math.round(Math.max(180, boardSize.width - sidePadding * 2)),
  );
  const availableHeight = Math.max(
    1,
    Math.round(Math.max(160, boardSize.height - verticalPadding * 2)),
  );
  let normalizedWidth = availableWidth;
  let normalizedHeight = availableHeight;

  if (imageFitMode === "contain") {
    const imageRatio = imageWidth / imageHeight;
    let containWidth = availableWidth;
    let containHeight = Math.round(containWidth / imageRatio);

    if (containHeight > availableHeight) {
      containHeight = availableHeight;
      containWidth = Math.round(containHeight * imageRatio);
    }

    normalizedWidth = Math.max(1, containWidth);
    normalizedHeight = Math.max(1, containHeight);
  }

  return {
    left: Math.round((boardSize.width - normalizedWidth) / 2),
    top: Math.round((boardSize.height - normalizedHeight) / 2),
    width: normalizedWidth,
    height: normalizedHeight,
  };
}

export function createNormalizedImage(sourceImage, boardSize, puzzleRect) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Не удалось подготовить холст для текстуры пазла.");
  }

  canvas.width = Math.max(1, Math.round(puzzleRect.width));
  canvas.height = Math.max(1, Math.round(puzzleRect.height));
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    sourceImage,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return {
    content: canvas,
    // Библиотека сама прибавляет targetPosition детали к текстуре.
    // Дополнительный offset здесь только уводит картинку от контура пазла.
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
