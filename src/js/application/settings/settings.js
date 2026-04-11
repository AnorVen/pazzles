import {
  accentColorInput,
  backgroundColorInput,
  boardColorInput,
  fileName,
  gameModeInputs,
  hintOpacityInput,
  imageAspectRatioInputs,
  imageFitModeInputs,
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
import {
  defaultImageAspectRatioId,
  getImageAspectRatioById,
} from "../../domain/settings/image-aspect-ratios.js";

const settingsStorageKey = "html-puzzle-settings";
const defaultSettings = {
  cols: 4,
  rows: 3,
  mode: "calm",
  accentColor: "#34c3a1",
  backgroundColor: "#11181c",
  boardColor: "#6d777b",
  hintOpacity: 0.3,
  imageFitMode: "stretch",
  imageAspectRatio: defaultImageAspectRatioId,
};

export function initializeSettings() {
  const savedSettings = readSavedSettings();

  piecesXInput.value = String(savedSettings.cols);
  piecesYInput.value = String(savedSettings.rows);
  accentColorInput.value = savedSettings.accentColor;
  backgroundColorInput.value = savedSettings.backgroundColor;
  boardColorInput.value = savedSettings.boardColor;
  hintOpacityInput.value = String(savedSettings.hintOpacity);
  setSelectedMode(gameModeInputs, savedSettings.mode || "calm");
  setSelectedMode(
    imageFitModeInputs,
    savedSettings.imageFitMode || defaultSettings.imageFitMode,
  );
  setSelectedMode(
    imageAspectRatioInputs,
    savedSettings.imageAspectRatio || defaultSettings.imageAspectRatio,
  );

  updateModeLabel();
  updateTotalPieces();
  applyAppearanceSettings();
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

export function getCurrentImageFitMode() {
  return getSelectedModeId(imageFitModeInputs) || defaultSettings.imageFitMode;
}

export function getCurrentImageAspectRatioId() {
  return (
    getSelectedModeId(imageAspectRatioInputs) ||
    defaultSettings.imageAspectRatio
  );
}

export function getCurrentImageAspectRatio() {
  return getImageAspectRatioById(getCurrentImageAspectRatioId());
}

export function saveSettings() {
  const { cols, rows } = updateTotalPieces();
  const mode = updateModeLabel();
  const appearance = getAppearanceSettings();

  localStorage.setItem(
    settingsStorageKey,
    JSON.stringify({
      cols,
      rows,
      mode,
      ...appearance,
      imageFitMode: getCurrentImageFitMode(),
      imageAspectRatio: getCurrentImageAspectRatioId(),
    }),
  );

  settingsStatusOutput.textContent =
    "Настройки сохранены. Новый формат применяется к следующим загрузкам в пул.";
}

export function setSelectedFileName(name) {
  fileName.textContent = name || "Картинка не выбрана";
}

function readSavedSettings() {
  try {
    const rawValue = localStorage.getItem(settingsStorageKey);

    if (!rawValue) {
      return { ...defaultSettings };
    }

    return {
      ...defaultSettings,
      ...JSON.parse(rawValue),
    };
  } catch {
    return { ...defaultSettings };
  }
}

export function applyAppearanceSettings() {
  const appearance = getAppearanceSettings();
  const root = document.documentElement;

  root.style.setProperty("--accent", appearance.accentColor);
  root.style.setProperty(
    "--accent-strong",
    darkenColor(appearance.accentColor, 0.18),
  );
  root.style.setProperty("--accent-soft", toRgba(appearance.accentColor, 0.14));
  root.style.setProperty("--bg", appearance.backgroundColor);
  root.style.setProperty(
    "--bg-deep",
    darkenColor(appearance.backgroundColor, 0.28),
  );
  root.style.setProperty("--board-base", appearance.boardColor);
  root.style.setProperty("--hint-opacity", String(appearance.hintOpacity));
}

export function getAppearanceSettings() {
  return {
    accentColor: accentColorInput.value,
    backgroundColor: backgroundColorInput.value,
    boardColor: boardColorInput.value,
    hintOpacity: normalizeHintOpacity(hintOpacityInput.value),
  };
}

function normalizeHintOpacity(value) {
  const numericValue = Number.parseFloat(value);

  if (Number.isNaN(numericValue)) {
    return defaultSettings.hintOpacity;
  }

  return Math.min(0.8, Math.max(0, numericValue));
}

function darkenColor(hexColor, amount) {
  const { r, g, b } = parseHexColor(hexColor);

  return toHexColor({
    r: r * (1 - amount),
    g: g * (1 - amount),
    b: b * (1 - amount),
  });
}

function toRgba(hexColor, alpha) {
  const { r, g, b } = parseHexColor(hexColor);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function parseHexColor(hexColor) {
  const normalizedColor = hexColor.replace("#", "");
  const expandedColor =
    normalizedColor.length === 3
      ? normalizedColor
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalizedColor;
  const numericValue = Number.parseInt(expandedColor, 16);

  return {
    r: (numericValue >> 16) & 255,
    g: (numericValue >> 8) & 255,
    b: numericValue & 255,
  };
}

function toHexColor({ r, g, b }) {
  const parts = [r, g, b].map((value) =>
    Math.round(value).toString(16).padStart(2, "0"),
  );

  return `#${parts.join("")}`;
}
