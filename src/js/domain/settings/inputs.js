import {
  maxPiecesPerSide,
  maxPiecesTotal,
  minPiecesTotal,
  minPiecesPerSide,
} from "./constants.js";

export function clampNumber(value, min, max) {
  const number = Number.parseInt(value, 10);

  if (Number.isNaN(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, number));
}

export function normalizePiecesValues(changedValue, pairedValue) {
  const normalizedChangedValue = clampNumber(
    changedValue,
    minPiecesPerSide,
    maxPiecesPerSide,
  );
  let normalizedPairedValue = clampNumber(
    pairedValue,
    minPiecesPerSide,
    maxPiecesPerSide,
  );
  const maxPairedValue = Math.max(
    minPiecesPerSide,
    Math.floor(maxPiecesTotal / normalizedChangedValue),
  );

  if (normalizedPairedValue > maxPairedValue) {
    normalizedPairedValue = maxPairedValue;
  }

  if (normalizedChangedValue * normalizedPairedValue < minPiecesTotal) {
    normalizedPairedValue = Math.min(maxPairedValue, minPiecesTotal);
  }

  return {
    cols: normalizedChangedValue,
    rows: normalizedPairedValue,
  };
}
