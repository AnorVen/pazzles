import {
  maxPiecesPerSide,
  maxPiecesTotal,
  minPiecesTotal,
  minPiecesPerSide,
} from "./constants.js";
import { piecesXInput, piecesYInput } from "./dom.js";

export function clampNumber(value, min, max) {
  const number = Number.parseInt(value, 10);

  if (Number.isNaN(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, number));
}

export function normalizePiecesInputs(
  changedInput = piecesXInput,
  pairedInput = piecesYInput,
) {
  const changedValue = clampNumber(
    changedInput.value,
    minPiecesPerSide,
    maxPiecesPerSide,
  );
  let pairedValue = clampNumber(
    pairedInput.value,
    minPiecesPerSide,
    maxPiecesPerSide,
  );
  const maxPairedValue = Math.max(
    minPiecesPerSide,
    Math.floor(maxPiecesTotal / changedValue),
  );

  if (pairedValue > maxPairedValue) {
    pairedValue = maxPairedValue;
  }

  if (changedValue * pairedValue < minPiecesTotal) {
    pairedValue = Math.min(maxPairedValue, minPiecesTotal);
  }

  changedInput.value = changedValue;
  pairedInput.value = pairedValue;

  return {
    cols: Number.parseInt(piecesXInput.value, 10),
    rows: Number.parseInt(piecesYInput.value, 10),
  };
}
