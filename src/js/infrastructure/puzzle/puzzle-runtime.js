import {
  areOriginalHorizontalNeighbors,
  areOriginalVerticalNeighbors,
  createPuzzleManufacturer,
  createPuzzleOutline,
  disableImageRepeat,
} from "./puzzle-factory.js";

export function createHeadbreakerCanvas(
  boardSize,
  puzzleRect,
  pieceSize,
  counts,
  normalizedImage,
) {
  const borderFill = {
    x: Math.max(4, pieceSize.x * 0.08),
    y: Math.max(4, pieceSize.y * 0.08),
  };

  return new headbreaker.Canvas("puzzleCanvas", {
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
    maxPiecesCount: { x: counts.cols, y: counts.rows },
    puzzleDiameter: { x: puzzleRect.width, y: puzzleRect.height },
    outline: createPuzzleOutline(),
  });
}

export function configurePuzzleCanvas(
  puzzleCanvas,
  cols,
  rows,
  pieceSize,
  puzzleRect,
  onWin,
) {
  const startAnchor = {
    x: puzzleRect.left + pieceSize.x / 2,
    y: puzzleRect.top + pieceSize.y / 2,
  };

  puzzleCanvas.autogenerateWithManufacturer(
    createPuzzleManufacturer(cols, rows, startAnchor),
  );
  puzzleCanvas.adjustImagesToPuzzleWidth();
  puzzleCanvas.refill();
  disableImageRepeat(puzzleCanvas);
  puzzleCanvas.puzzle.attachHorizontalConnectionRequirement(
    areOriginalHorizontalNeighbors,
  );
  puzzleCanvas.puzzle.attachVerticalConnectionRequirement(
    areOriginalVerticalNeighbors,
  );
  puzzleCanvas.attachSolvedValidator();
  puzzleCanvas.shuffle(0.8);
  puzzleCanvas.draw();

  // Соединенные кусочки должны оставаться одной группой при дальнейшем перетаскивании.
  puzzleCanvas.puzzle.forceConnectionWhileDragging();
  puzzleCanvas.onValid(onWin);
}

export function centerSolvedPuzzle(puzzleCanvas) {
  const bounds = getPuzzleBounds(puzzleCanvas);

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

function getPuzzleBounds(puzzleCanvas) {
  if (!puzzleCanvas || !puzzleCanvas.puzzle.pieces.length) {
    return null;
  }

  const anchors = puzzleCanvas.puzzle.pieces.flatMap((piece) => [
    piece.leftAnchor,
    piece.rightAnchor,
    piece.upAnchor,
    piece.downAnchor,
  ]);
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
