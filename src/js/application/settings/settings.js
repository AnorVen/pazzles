import {
  fileName,
  gameModeInputs,
  piecesXInput,
  piecesYInput,
  selectedModeLabel,
  settingsStatusOutput,
  totalPiecesOutput,
} from "../../presentation/dom.js";
import { normalizePiecesValues } from "../../domain/settings/inputs.js";
import { minPiecesTotal } from "../../domain/settings/constants.js";
import {
  getGameMode,
  getSelectedModeId,
  setSelectedMode,
} from "../../domain/game/game-modes.js";

const settingsStorageKey = "html-puzzle-settings";

export function initializeSettings() {
  const savedSettings = readSavedSettings();

  if (savedSettings) {
    piecesXInput.value = String(savedSettings.cols);
    piecesYInput.value = String(savedSettings.rows);
    setSelectedMode(gameModeInputs, savedSettings.mode || "calm");
  }

  updateModeLabel();
  updateTotalPieces();
}

export function updateTotalPieces(changedInput, pairedInput) {
  const { cols, rows } = getNormalizedPiecesFromInputs(
    changedInput,
    pairedInput,
  );
  const totalPieces = cols * rows;

  totalPiecesOutput.textContent = String(totalPieces);

  if (totalPieces < minPiecesTotal) {
    settingsStatusOutput.textContent = "Минимальный размер пазла — 2 элемента.";
  } else {
    settingsStatusOutput.textContent = "";
  }

  return { cols, rows };
}

export function getNormalizedPiecesFromInputs(
  changedInput = piecesXInput,
  pairedInput = piecesYInput,
) {
  const { cols, rows } = normalizePiecesValues(
    changedInput.value,
    pairedInput.value,
  );

  changedInput.value = String(cols);
  pairedInput.value = String(rows);

  return { cols, rows };
}

export function updateModeLabel() {
  const mode = getGameMode(getSelectedModeId(gameModeInputs));

  selectedModeLabel.textContent = mode.label;
  return mode.id;
}

export function getCurrentMode() {
  return getSelectedModeId(gameModeInputs);
}

export function saveSettings() {
  const { cols, rows } = updateTotalPieces();
  const mode = updateModeLabel();

  localStorage.setItem(
    settingsStorageKey,
    JSON.stringify({
      cols,
      rows,
      mode,
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
