const imagePool = [];
let preparedImageId = "";

const imagePoolDatabaseName = "html-puzzle-storage";
const imagePoolStoreName = "keyvalue";
const imagePoolStorageKey = "image-pool";
const maxImageSide = 2048;
const maxImagePixels = 3_145_728;
const jpegQuality = 0.88;
const targetAspectRatio = 16 / 9;
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
      });
    });

    preparedImageId =
      typeof parsedValue?.preparedImageId === "string"
        ? parsedValue.preparedImageId
        : "";

    if (!imagePool.some((entry) => entry.id === preparedImageId)) {
      preparedImageId = imagePool[0]?.id || "";
    }

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

export async function addImagesToPool(files) {
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
    fileList.map(async (file) => ({
      id: createImageId(file),
      name: file.name,
      src: await normalizeImageForPuzzle(file),
    })),
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

  const availableEntries =
    imagePool.length > 1 && avoidImageId
      ? imagePool.filter((entry) => entry.id !== avoidImageId)
      : imagePool;
  const nextEntry =
    availableEntries[Math.floor(Math.random() * availableEntries.length)] ||
    imagePool[0];

  preparedImageId = nextEntry.id;
  void persistImagePool();
  return nextEntry;
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

async function normalizeImageForPuzzle(file) {
  const sourceUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceUrl);
  const cropRect = calculateCropRect(
    image.naturalWidth,
    image.naturalHeight,
    targetAspectRatio,
  );
  const targetSize = calculateNormalizedSize(cropRect.width, cropRect.height);
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

  return canvas.toDataURL(getOutputMimeType(file.type), jpegQuality);
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

function getOutputMimeType(inputMimeType) {
  if (inputMimeType === "image/png") {
    return "image/png";
  }

  return "image/jpeg";
}

function isSupportedImageFile(file) {
  if (supportedMimeTypes.has(file.type)) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(extension && supportedExtensions.has(extension));
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
