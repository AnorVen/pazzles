export function createPuzzleManufacturer(cols, rows, startAnchor) {
  const manufacturer = new headbreaker.Manufacturer();
  const insertsGenerator = getPuzzleGenerator();

  manufacturer.withDimensions(cols, rows);
  manufacturer.withHeadAt(headbreaker.anchor(startAnchor.x, startAnchor.y));
  manufacturer.withMetadata(createPieceMetadata(cols, rows));

  if (insertsGenerator) {
    manufacturer.withInsertsGenerator(insertsGenerator);
  }

  return manufacturer;
}

export function createPuzzleOutline() {
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

export function disableImageRepeat(puzzleCanvas) {
  puzzleCanvas.puzzle.pieces.forEach((piece) => {
    const figure = puzzleCanvas.getFigure(piece);

    if (figure && figure.shape && figure.shape.fillPatternRepeat) {
      figure.shape.fillPatternRepeat("no-repeat");
    }
  });
}

export function areOriginalHorizontalNeighbors(firstPiece, secondPiece) {
  const colDistance = Math.abs(
    firstPiece.metadata.col - secondPiece.metadata.col,
  );
  const isSameRow = firstPiece.metadata.row === secondPiece.metadata.row;

  return isSameRow && colDistance === 1;
}

export function areOriginalVerticalNeighbors(firstPiece, secondPiece) {
  const rowDistance = Math.abs(
    firstPiece.metadata.row - secondPiece.metadata.row,
  );
  const isSameColumn = firstPiece.metadata.col === secondPiece.metadata.col;

  return isSameColumn && rowDistance === 1;
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

function getPuzzleGenerator() {
  if (headbreaker.generators && headbreaker.generators.random) {
    return headbreaker.generators.random;
  }

  return undefined;
}
