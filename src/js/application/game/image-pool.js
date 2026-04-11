import { getImageAspectRatioValue } from "../../domain/settings/image-aspect-ratios.js";

const imagePool = [];
let preparedImageId = "";

const imagePoolDatabaseName = "html-puzzle-storage";
const imagePoolStoreName = "keyvalue";
const imagePoolStorageKey = "image-pool";
const maxImageSide = 2048;
const maxImagePixels = 3_145_728;
const jpegQuality = 0.88;
const supportedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
]);
const supportedExtensions = new Set(["jpg", "jpeg", "png", "webp", "bmp"]);

export async function restoreImagePool() {
  try {
    const parsedValue = await readStoredPool();
    const entries = Array.isArray(parsedValue?.entries)
      ? parsedValue.entries
      : [];

    imagePool.length = 0;
    entries.forEach((entry) => {
      if (!isValidPoolEntry(entry)) {
        return;
      }

      imagePool.push({
        id: entry.id,
        name: entry.name,
        src: entry.src,
        originalSrc:
          typeof entry.originalSrc === "string" ? entry.originalSrc : "",
      });
    });

    preparedImageId = imagePool[0]?.id || "";

    return {
      restored: imagePool.length,
    };
  } catch {
    imagePool.length = 0;
    preparedImageId = "";

    return {
      restored: 0,
    };
  }
}

export async function addImagesToPool(files, aspectRatioId) {
  const allFiles = Array.from(files);
  const fileList = allFiles.filter(isSupportedImageFile);
  const rejected = allFiles.length - fileList.length;

  if (!fileList.length) {
    return {
      added: 0,
      total: imagePool.length,
      rejected,
    };
  }

  const preparedEntries = await Promise.all(
    fileList.map(async (file) => createPreparedPoolEntry(file, aspectRatioId)),
  );
  let added = 0;

  preparedEntries.forEach((entry) => {
    if (imagePool.some((item) => item.id === entry.id)) {
      return;
    }

    imagePool.push(entry);
    added += 1;
  });

  if (!preparedImageId && imagePool.length) {
    preparedImageId = imagePool[0].id;
  }

  await persistImagePool();

  return {
    added,
    total: imagePool.length,
    rejected,
  };
}

export async function clearImagePool() {
  imagePool.length = 0;
  preparedImageId = "";
  await persistImagePool();
}

export async function repreparePoolForAspectRatio(aspectRatioId) {
  if (!imagePool.length) {
    return {
      updated: 0,
      fromOriginal: 0,
      fallbackUpdated: 0,
    };
  }

  let fromOriginal = 0;
  let fallbackUpdated = 0;

  for (const entry of imagePool) {
    const sourceUrl = entry.originalSrc || entry.src;
    const nextImage = await normalizeImageForPuzzleFromSource(
      sourceUrl,
      aspectRatioId,
    );

    entry.src = nextImage;

    if (!entry.originalSrc) {
      entry.originalSrc = sourceUrl;
      fallbackUpdated += 1;
      continue;
    }

    fromOriginal += 1;
  }

  await persistImagePool();

  return {
    updated: imagePool.length,
    fromOriginal,
    fallbackUpdated,
  };
}

export function hasImagesInPool() {
  return imagePool.length > 0;
}

export function getPoolSnapshot() {
  return imagePool.map((entry) => ({
    id: entry.id,
    name: entry.name,
    src: entry.src,
    isPrepared: entry.id === preparedImageId,
  }));
}

export function getPoolSize() {
  return imagePool.length;
}

export function getPreparedImageEntry() {
  return imagePool.find((entry) => entry.id === preparedImageId) || null;
}

export function prepareRandomImage({ avoidImageId = "" } = {}) {
  if (!imagePool.length) {
    preparedImageId = "";
    void persistImagePool();
    return null;
  }

  const nextEntry = getNextQueueEntry(avoidImageId);

  moveEntryToFront(nextEntry.id);
  preparedImageId = nextEntry.id;
  void persistImagePool();
  return imagePool[0];
}

export async function reorderPoolEntries(
  draggedImageId,
  targetImageId,
  targetPosition = "before",
) {
  if (!draggedImageId || !targetImageId || draggedImageId === targetImageId) {
    return false;
  }

  const draggedIndex = imagePool.findIndex(
    (entry) => entry.id === draggedImageId,
  );
  const targetIndex = imagePool.findIndex(
    (entry) => entry.id === targetImageId,
  );

  if (draggedIndex < 0 || targetIndex < 0) {
    return false;
  }

  const [draggedEntry] = imagePool.splice(draggedIndex, 1);
  let nextTargetIndex = imagePool.findIndex(
    (entry) => entry.id === targetImageId,
  );

  if (nextTargetIndex < 0) {
    imagePool.splice(draggedIndex, 0, draggedEntry);
    return false;
  }

  if (targetPosition === "after") {
    nextTargetIndex += 1;
  }

  imagePool.splice(nextTargetIndex, 0, draggedEntry);
  preparedImageId = imagePool[0]?.id || "";
  await persistImagePool();

  return true;
}

function createImageId(file) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result || ""));
    };
    reader.onerror = () => {
      reject(new Error("Не удалось прочитать изображение."));
    };
    reader.readAsDataURL(file);
  });
}

async function normalizeImageForPuzzle(file, aspectRatioId) {
  const sourceUrl = await readFileAsDataUrl(file);
  const originalSrc = await normalizeOriginalImageSource(sourceUrl);
  const src = await normalizeImageForPuzzleFromSource(
    originalSrc,
    aspectRatioId,
  );

  return {
    originalSrc,
    src,
  };
}

async function createPreparedPoolEntry(file, aspectRatioId) {
  const preparedImage = await normalizeImageForPuzzle(file, aspectRatioId);

  return {
    id: createImageId(file),
    name: file.name,
    src: preparedImage.src,
    originalSrc: preparedImage.originalSrc,
  };
}

async function normalizeImageForPuzzleFromSource(sourceUrl, aspectRatioId) {
  const image = await loadImage(sourceUrl);
  const aspectRatio = getImageAspectRatioValue(aspectRatioId);
  const cropRect = calculateCropRect(
    image.naturalWidth,
    image.naturalHeight,
    aspectRatio,
  );
  const targetSize = calculateNormalizedAspectSize(
    cropRect.width,
    cropRect.height,
    aspectRatio,
  );
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Не удалось подготовить холст для изображения.");
  }

  canvas.width = targetSize.width;
  canvas.height = targetSize.height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    cropRect.left,
    cropRect.top,
    cropRect.width,
    cropRect.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL(
    getOutputMimeTypeFromSourceUrl(sourceUrl),
    jpegQuality,
  );
}

async function normalizeOriginalImageSource(sourceUrl) {
  const image = await loadImage(sourceUrl);
  const targetSize = calculateNormalizedSize(
    image.naturalWidth,
    image.naturalHeight,
  );
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Не удалось подготовить исходное изображение для пула.");
  }

  canvas.width = targetSize.width;
  canvas.height = targetSize.height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL(
    getOutputMimeTypeFromSourceUrl(sourceUrl),
    jpegQuality,
  );
}

function calculateCropRect(width, height, aspectRatio) {
  const sourceWidth = Math.max(1, Math.round(width));
  const sourceHeight = Math.max(1, Math.round(height));
  const currentAspectRatio = sourceWidth / sourceHeight;

  if (Math.abs(currentAspectRatio - aspectRatio) < 0.0001) {
    return {
      left: 0,
      top: 0,
      width: sourceWidth,
      height: sourceHeight,
    };
  }

  if (currentAspectRatio > aspectRatio) {
    const croppedWidth = Math.round(sourceHeight * aspectRatio);

    return {
      left: Math.round((sourceWidth - croppedWidth) / 2),
      top: 0,
      width: croppedWidth,
      height: sourceHeight,
    };
  }

  const croppedHeight = Math.round(sourceWidth / aspectRatio);

  return {
    left: 0,
    top: Math.round((sourceHeight - croppedHeight) / 2),
    width: sourceWidth,
    height: croppedHeight,
  };
}

function calculateNormalizedSize(width, height) {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const sideScale = Math.min(1, maxImageSide / Math.max(safeWidth, safeHeight));
  const pixelsScale = Math.min(
    1,
    Math.sqrt(maxImagePixels / (safeWidth * safeHeight)),
  );
  const scale = Math.min(sideScale, pixelsScale);

  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}

function calculateNormalizedAspectSize(width, height, aspectRatio) {
  const normalizedSource = calculateNormalizedSize(width, height);
  let targetWidth = normalizedSource.width;
  let targetHeight = Math.max(1, Math.round(targetWidth / aspectRatio));

  if (targetHeight > normalizedSource.height) {
    targetHeight = normalizedSource.height;
    targetWidth = Math.max(1, Math.round(targetHeight * aspectRatio));
  }

  if (targetWidth > maxImageSide) {
    targetWidth = maxImageSide;
    targetHeight = Math.max(1, Math.round(targetWidth / aspectRatio));
  }

  if (targetWidth * targetHeight > maxImagePixels) {
    const pixelsScale = Math.sqrt(
      maxImagePixels / (targetWidth * targetHeight),
    );

    targetWidth = Math.max(1, Math.floor(targetWidth * pixelsScale));
    targetHeight = Math.max(1, Math.round(targetWidth / aspectRatio));
  }

  return {
    width: targetWidth,
    height: targetHeight,
  };
}

function loadImage(sourceUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error("Не удалось декодировать изображение."));
    };
    image.src = sourceUrl;
  });
}

function getOutputMimeTypeFromSourceUrl(sourceUrl) {
  return sourceUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg";
}

function isSupportedImageFile(file) {
  if (supportedMimeTypes.has(file.type)) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(extension && supportedExtensions.has(extension));
}

function getNextQueueEntry(avoidImageId) {
  if (!avoidImageId) {
    return imagePool[0];
  }

  const startIndex = avoidImageId
    ? imagePool.findIndex((entry) => entry.id === avoidImageId)
    : -1;

  if (startIndex >= 0) {
    for (let index = 1; index <= imagePool.length; index += 1) {
      const candidate = imagePool[(startIndex + index) % imagePool.length];

      if (candidate && candidate.id !== avoidImageId) {
        return candidate;
      }
    }
  }

  return imagePool[0];
}

function moveEntryToFront(entryId) {
  const entryIndex = imagePool.findIndex((entry) => entry.id === entryId);

  if (entryIndex <= 0) {
    return;
  }

  const [entry] = imagePool.splice(entryIndex, 1);
  imagePool.unshift(entry);
}

async function persistImagePool() {
  const database = await openPoolDatabase();

  await runTransaction(database, "readwrite", (store, resolve, reject) => {
    const request = store.put(
      {
        preparedImageId,
        entries: imagePool,
      },
      imagePoolStorageKey,
    );

    request.onsuccess = () => {
      resolve(true);
    };
    request.onerror = () => {
      reject(request.error || new Error("Не удалось сохранить пул."));
    };
  });
}

async function readStoredPool() {
  const database = await openPoolDatabase();

  return runTransaction(database, "readonly", (store, resolve, reject) => {
    const request = store.get(imagePoolStorageKey);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => {
      reject(request.error || new Error("Не удалось восстановить пул."));
    };
  });
}

function openPoolDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(imagePoolDatabaseName, 1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(imagePoolStoreName)) {
        database.createObjectStore(imagePoolStoreName);
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error || new Error("Не удалось открыть хранилище пула."));
    };
  });
}

function runTransaction(database, mode, executor) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(imagePoolStoreName, mode);
    const store = transaction.objectStore(imagePoolStoreName);

    transaction.onerror = () => {
      reject(
        transaction.error || new Error("Ошибка транзакции хранилища пула."),
      );
    };

    executor(store, resolve, reject);
  });
}

function isValidPoolEntry(entry) {
  return (
    entry &&
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    typeof entry.src === "string"
  );
}
