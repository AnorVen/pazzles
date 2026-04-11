export const defaultImageAspectRatioId = "16:9";

export const imageAspectRatios = {
  "16:9": {
    id: "16:9",
    label: "16:9",
    width: 16,
    height: 9,
  },
  "4:3": {
    id: "4:3",
    label: "4:3",
    width: 4,
    height: 3,
  },
  "1:1": {
    id: "1:1",
    label: "1:1",
    width: 1,
    height: 1,
  },
  "3:4": {
    id: "3:4",
    label: "3:4",
    width: 3,
    height: 4,
  },
  "9:16": {
    id: "9:16",
    label: "9:16",
    width: 9,
    height: 16,
  },
};

export function getImageAspectRatioById(aspectRatioId) {
  return (
    imageAspectRatios[aspectRatioId] ||
    imageAspectRatios[defaultImageAspectRatioId]
  );
}

export function getImageAspectRatioValue(aspectRatioId) {
  const aspectRatio = getImageAspectRatioById(aspectRatioId);

  return aspectRatio.width / aspectRatio.height;
}
