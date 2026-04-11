import { board, hintButton, winModal } from "./dom.js";

let isHintVisible = false;

export function resetBoard() {
  board.innerHTML = "";
  board.classList.remove("showHint");
  winModal.hidden = true;
}

export function createHintLayer(imageUrl) {
  const hintLayer = document.createElement("div");
  const hintImage = document.createElement("img");

  hintLayer.className = "hintLayer";
  hintImage.src = imageUrl;
  hintImage.alt = "Подсказка исходной картинки";
  hintLayer.append(hintImage);

  return hintLayer;
}

export function toggleHint(loadedImage, statusOutput) {
  if (!loadedImage) {
    statusOutput.textContent = "Сначала загрузите картинку.";
    return;
  }

  setHintVisible(!isHintVisible);
}

export function setHintVisible(isVisible) {
  isHintVisible = isVisible;
  board.classList.toggle("showHint", isHintVisible);
  hintButton.classList.toggle("isActive", isHintVisible);
  hintButton.setAttribute("aria-pressed", String(isHintVisible));
  hintButton.textContent = isHintVisible
    ? "Скрыть подсказку"
    : "Показать подсказку";
}
