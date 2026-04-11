import {
  accentColorInput,
  backgroundColorInput,
  boardColorInput,
  clearPoolButton,
  clearLeadersButton,
  closeModal,
  closeLoseModalButton,
  exitButton,
  exportLeadersButton,
  gameModeInputs,
  gameSettingsButton,
  hintButton,
  howToPlayBackButton,
  hintOpacityInput,
  imageAspectRatioInputs,
  imageFitModeInputs,
  leadersBackButton,
  leadersSortSelect,
  menuButton,
  menuHint,
  newGameButton,
  openHowToPlayButton,
  openLeadersFromModalButton,
  openPoolButton,
  openSettingsButton,
  orderButton,
  piecesXInput,
  piecesYInput,
  poolCountOutput,
  poolInput,
  poolList,
  poolPreview,
  poolPreviewImage,
  poolPreviewMeta,
  poolPreviewName,
  poolSummaryOutput,
  refreshLeadersButton,
  repreparePoolButton,
  saveSettingsButton,
  settingsStatusOutput,
  shuffleButton,
  settingsBackButton,
  statusOutput,
  winModal,
} from "../presentation/dom.js";
import { applyStaticCopy } from "../content/app-copy.js";
import { canExitApp, exitApp } from "../infrastructure/platform/app-api.js";
import {
  ensurePreparedImage,
  handleLoseModalClose,
  handleWinModalClose,
  orderPieces,
  resetPreparedImageState,
  shufflePieces,
  startPuzzle,
  toggleHintVisibility,
} from "../application/game/game.js";
import {
  addImagesToPool,
  clearImagePool,
  getPoolSize,
  getPoolSnapshot,
  repreparePoolForAspectRatio,
  reorderPoolEntries,
  restoreImagePool,
} from "../application/game/image-pool.js";
import { clearLeaders, exportLeaders } from "../presentation/leaders.js";
import { showPage } from "../presentation/navigation.js";
import { refreshLeadersPage } from "../application/results/results.js";
import {
  applyAppearanceSettings,
  getCurrentImageAspectRatio,
  initializeSettings,
  saveSettings,
  updateModeLabel,
  updateTotalPieces,
} from "../application/settings/settings.js";

initializeSettings();
updateTotalPieces();
applyStaticCopy();
renderPoolState();
window.addEventListener("pool:prepared-image-changed", renderPoolState);
void bootstrapApp();
poolList.addEventListener("mouseover", handlePoolPreviewHover);
poolList.addEventListener("focusin", handlePoolPreviewHover);
poolList.addEventListener("mouseout", handlePoolPreviewLeave);
poolList.addEventListener("focusout", handlePoolPreviewFocusLeave);
poolList.addEventListener("dragstart", handlePoolDragStart);
poolList.addEventListener("dragover", handlePoolDragOver);
poolList.addEventListener("drop", handlePoolDrop);
poolList.addEventListener("dragend", handlePoolDragEnd);

let draggedPoolItemId = "";

newGameButton.addEventListener("click", async () => {
  const hasPreparedImage = await ensurePreparedImage();

  if (!hasPreparedImage) {
    menuHint.textContent =
      "Старт недоступен: сначала загрузите хотя бы одну картинку в пул.";
    return;
  }

  showPage("game");
  startPuzzle();
});
hintButton.addEventListener("click", toggleHintVisibility);
orderButton.addEventListener("click", orderPieces);
shuffleButton.addEventListener("click", shufflePieces);
piecesXInput.addEventListener("input", () =>
  updateTotalPieces(piecesXInput, piecesYInput),
);
piecesYInput.addEventListener("input", () =>
  updateTotalPieces(piecesYInput, piecesXInput),
);
gameModeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    updateModeLabel();
  });
});
imageFitModeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    saveSettings();
  });
});
imageAspectRatioInputs.forEach((input) => {
  input.addEventListener("change", () => {
    saveSettings();
  });
});
[
  accentColorInput,
  backgroundColorInput,
  boardColorInput,
  hintOpacityInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    applyAppearanceSettings();
  });
});
saveSettingsButton.addEventListener("click", saveSettings);
repreparePoolButton.addEventListener("click", async () => {
  const aspectRatio = getCurrentImageAspectRatio();

  saveSettings();
  repreparePoolButton.disabled = true;
  settingsStatusOutput.textContent =
    "Переподготавливаю пул под новый формат. Это может занять несколько секунд.";

  try {
    const { updated, fromOriginal, fallbackUpdated } =
      await repreparePoolForAspectRatio(aspectRatio.id);

    if (updated > 0) {
      await ensurePreparedImage();
    }

    renderPoolState();

    if (updated === 0) {
      settingsStatusOutput.textContent =
        "Пул пуст. Сначала загрузите изображения.";
      return;
    }

    settingsStatusOutput.textContent =
      fallbackUpdated > 0
        ? `Пул переподготовлен: ${updated} изображений. Из исходников обновлено ${fromOriginal}, для ${fallbackUpdated} использована текущая версия без повторной загрузки.`
        : `Пул переподготовлен: ${updated} изображений под формат ${aspectRatio.label}.`;
    menuHint.textContent =
      "Пул изображений обновлён под текущий формат. Следующая партия уже синхронизирована.";
    statusOutput.textContent =
      "Подготовленные изображения, поле и подсказка будут использовать новый формат.";
  } catch {
    settingsStatusOutput.textContent =
      "Не удалось переподготовить пул под текущий формат.";
  } finally {
    repreparePoolButton.disabled = false;
  }
});
closeModal.addEventListener("click", handleWinModalClose);
closeLoseModalButton.addEventListener("click", () => {
  handleLoseModalClose();
  showPage("menu");
});
openLeadersFromModalButton.addEventListener("click", async () => {
  winModal.hidden = true;
  showPage("leaders");
  await refreshLeadersPage();
});
openSettingsButton.addEventListener("click", () => {
  showPage("settings");
});
settingsBackButton.addEventListener("click", () => {
  showPage("menu");
});
menuButton.addEventListener("click", () => {
  showPage("menu");
});
gameSettingsButton.addEventListener("click", () => {
  showPage("settings");
});
openHowToPlayButton.addEventListener("click", () => {
  showPage("howToPlay");
});
howToPlayBackButton.addEventListener("click", () => {
  showPage("menu");
});
openPoolButton.addEventListener("click", () => {
  poolInput.click();
});
poolInput.addEventListener("change", async () => {
  try {
    const { added, total, rejected } = await addImagesToPool(
      poolInput.files,
      getCurrentImageAspectRatio().id,
    );

    if (total > 0) {
      await ensurePreparedImage();
    }

    renderPoolState();

    if (added > 0) {
      menuHint.textContent =
        rejected > 0
          ? `В пул добавлено ${added} изображений. Отклонено по формату: ${rejected}.`
          : `В пул добавлено ${added} изображений. Можно начинать игру.`;
    } else if (rejected > 0) {
      menuHint.textContent =
        "Поддерживаются только JPG, PNG, WEBP и BMP. SVG и GIF не загружаются.";
    } else {
      menuHint.textContent =
        "Новые изображения не добавлены. Возможно, они уже были в пуле.";
    }
  } catch {
    menuHint.textContent =
      "Не удалось загрузить или сохранить изображения. Попробуйте меньший набор.";
  } finally {
    poolInput.value = "";
  }
});
clearPoolButton.addEventListener("click", async () => {
  await clearImagePool();
  resetPreparedImageState();
  renderPoolState();
  menuHint.textContent = "Пул очищен. Загрузите новую группу картинок.";
  statusOutput.textContent = "Пул изображений очищен.";
});
leadersBackButton.addEventListener("click", () => {
  showPage("menu");
});
refreshLeadersButton.addEventListener("click", async () => {
  await refreshLeadersPage();
});
leadersSortSelect.addEventListener("change", async () => {
  await refreshLeadersPage();
});
exportLeadersButton.addEventListener("click", async () => {
  await exportLeaders();
});
clearLeadersButton.addEventListener("click", async () => {
  const isConfirmed = window.confirm(
    "Удалить все результаты из локальной базы лидеров?",
  );

  if (!isConfirmed) {
    return;
  }

  await clearLeaders();
});

if (!canExitApp()) {
  exitButton.disabled = true;
  exitButton.title = "Кнопка выхода доступна только в Electron-приложении.";
}

exitButton.addEventListener("click", () => {
  const didClose = exitApp();

  if (!didClose) {
    menuHint.textContent =
      "Кнопка выхода работает только внутри Electron-приложения.";
    statusOutput.textContent =
      "Режим браузера не может закрыть окно приложения автоматически.";
  }
});

function renderPoolState() {
  const poolItems = getPoolSnapshot();
  const hasPoolItems = poolItems.length > 0;

  poolCountOutput.textContent = String(getPoolSize());
  newGameButton.disabled = !hasPoolItems;
  newGameButton.title = hasPoolItems
    ? ""
    : "Кнопка станет активной после загрузки хотя бы одной картинки.";
  poolSummaryOutput.textContent = poolItems.length
    ? `В пуле ${poolItems.length} изображений. Отмеченная картинка уже подготовлена.`
    : "Добавьте изображения для первой партии.";

  if (!poolItems.length) {
    poolList.innerHTML = "<li>Пул пока пуст.</li>";
    hidePoolPreview();
    return;
  }

  poolList.innerHTML = poolItems
    .map(
      (item) =>
        `<li
          class="poolItem${item.id === draggedPoolItemId ? " poolItem--dragging" : ""}"
          data-pool-item-id="${escapeHtml(item.id)}"
          draggable="true"
        >
          <button
            type="button"
            class="poolItemButton"
            data-preview-src="${escapeHtml(item.src)}"
            data-preview-name="${escapeHtml(item.name)}"
            data-preview-state="${item.isPrepared ? "Следующая партия уже подготовлена" : "Изображение лежит в общем пуле"}"
          >
            ${item.isPrepared ? "Следующая: " : ""}${escapeHtml(item.name)}
          </button>
        </li>`,
    )
    .join("");

  showPoolPreview(poolItems[0]);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function handlePoolDragStart(event) {
  const item = event.target.closest("[data-pool-item-id]");

  if (!(item instanceof HTMLElement)) {
    return;
  }

  draggedPoolItemId = item.dataset.poolItemId || "";

  if (!draggedPoolItemId) {
    return;
  }

  item.classList.add("poolItem--dragging");

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedPoolItemId);
  }
}

function handlePoolDragOver(event) {
  const item = event.target.closest("[data-pool-item-id]");

  if (!(item instanceof HTMLElement) || !draggedPoolItemId) {
    return;
  }

  event.preventDefault();

  const bounds = item.getBoundingClientRect();
  const targetPosition =
    event.clientY > bounds.top + bounds.height / 2 ? "after" : "before";

  poolList
    .querySelectorAll(".poolItem--dropBefore, .poolItem--dropAfter")
    .forEach((element) => {
      element.classList.remove("poolItem--dropBefore", "poolItem--dropAfter");
    });
  item.classList.add(
    targetPosition === "after" ? "poolItem--dropAfter" : "poolItem--dropBefore",
  );
}

async function handlePoolDrop(event) {
  const item = event.target.closest("[data-pool-item-id]");

  if (!(item instanceof HTMLElement) || !draggedPoolItemId) {
    return;
  }

  event.preventDefault();

  const targetImageId = item.dataset.poolItemId || "";
  const bounds = item.getBoundingClientRect();
  const targetPosition =
    event.clientY > bounds.top + bounds.height / 2 ? "after" : "before";
  const didReorder = await reorderPoolEntries(
    draggedPoolItemId,
    targetImageId,
    targetPosition,
  );

  clearPoolDropMarkers();
  draggedPoolItemId = "";

  if (!didReorder) {
    renderPoolState();
    return;
  }

  renderPoolState();
  restoreDefaultPoolPreview();
  menuHint.textContent = "Очередность пула обновлена.";
  statusOutput.textContent =
    "Порядок изображений сохранён. Следующая партия пойдёт по новой очереди.";
}

function handlePoolDragEnd() {
  clearPoolDropMarkers();
  draggedPoolItemId = "";
  renderPoolState();
}

function clearPoolDropMarkers() {
  poolList
    .querySelectorAll(
      ".poolItem--dropBefore, .poolItem--dropAfter, .poolItem--dragging",
    )
    .forEach((element) => {
      element.classList.remove(
        "poolItem--dropBefore",
        "poolItem--dropAfter",
        "poolItem--dragging",
      );
    });
}

function handlePoolPreviewHover(event) {
  const trigger = event.target.closest("[data-preview-src]");

  if (!trigger) {
    return;
  }

  showPoolPreview({
    src: trigger.dataset.previewSrc || "",
    name: trigger.dataset.previewName || "Превью изображения",
    isPrepared: (trigger.dataset.previewState || "").includes("подготовлена"),
  });
  poolPreviewMeta.textContent =
    trigger.dataset.previewState || "Изображение лежит в общем пуле.";
}

function handlePoolPreviewLeave(event) {
  const nextTarget = event.relatedTarget;

  if (nextTarget instanceof Element && poolList.contains(nextTarget)) {
    return;
  }

  restoreDefaultPoolPreview();
}

function handlePoolPreviewFocusLeave(event) {
  const nextTarget = event.relatedTarget;

  if (nextTarget instanceof Element && poolList.contains(nextTarget)) {
    return;
  }

  restoreDefaultPoolPreview();
}

function showPoolPreview(item) {
  if (!item?.src) {
    hidePoolPreview();
    return;
  }

  poolPreview.hidden = false;
  poolPreviewImage.src = item.src;
  poolPreviewImage.alt = `Превью изображения ${item.name || ""}`.trim();
  poolPreviewName.textContent = item.name || "Превью изображения";
  poolPreviewMeta.textContent = item.isPrepared
    ? "Следующая партия уже подготовлена."
    : "Изображение лежит в общем пуле.";
}

function restoreDefaultPoolPreview() {
  const poolItems = getPoolSnapshot();
  const defaultItem = poolItems.find((item) => item.isPrepared) || poolItems[0];

  if (!defaultItem) {
    hidePoolPreview();
    return;
  }

  showPoolPreview(defaultItem);
}

function hidePoolPreview() {
  poolPreview.hidden = true;
  poolPreviewImage.removeAttribute("src");
  poolPreviewImage.alt = "";
  poolPreviewName.textContent = "Превью изображения";
  poolPreviewMeta.textContent = "Наведите на элемент списка.";
}

async function bootstrapApp() {
  const { restored } = await restoreImagePool();

  if (!restored) {
    renderPoolState();
    return;
  }

  await ensurePreparedImage();
  renderPoolState();
  menuHint.textContent = `Восстановлено изображений из прошлого запуска: ${restored}.`;
}
