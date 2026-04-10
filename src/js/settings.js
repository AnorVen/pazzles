import {
  fileName,
  piecesXInput,
  piecesYInput,
  settingsStatusOutput,
  totalPiecesOutput,
} from "./dom.js";
import { normalizePiecesInputs } from "./inputs.js";
import { minPiecesTotal } from "./constants.js";

const settingsStorageKey = "html-puzzle-settings";

export function initializeSettings() {
  const savedSettings = readSavedSettings();

  if (savedSettings) {
    piecesXInput.value = String(savedSettings.cols);
    piecesYInput.value = String(savedSettings.rows);
  }

  updateTotalPieces();
}

export function updateTotalPieces(changedInput, pairedInput) {
  const { cols, rows } = normalizePiecesInputs(changedInput, pairedInput);
  const totalPieces = cols * rows;

  totalPiecesOutput.textContent = String(totalPieces);

  if (totalPieces < minPiecesTotal) {
    settingsStatusOutput.textContent = "Минимальный размер пазла — 2 элемента.";
  } else {
    settingsStatusOutput.textContent = "";
  }

  return { cols, rows };
}

export function saveSettings() {
  const { cols, rows } = updateTotalPieces();

  localStorage.setItem(
    settingsStorageKey,
    JSON.stringify({
      cols,
      rows,
    }),
  );

  settingsStatusOutput.textContent = "Настройки сохранены.";
}

export function setSelectedFileName(name) {
  fileName.textContent = name || "Картинка не выбрана";
}

function readSavedSettings() {
  try {
    const rawValue = localStorage.getItem(settingsStorageKey);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}
