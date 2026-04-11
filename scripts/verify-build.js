const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const buildResult = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

const outputDirectory = path.join(
  ".build-checks",
  `electron-${Date.now().toString(36)}`,
);

const result = spawnSync(
  "npx",
  [
    "electron-builder",
    "--win",
    "--x64",
    `--config.directories.output=${outputDirectory}`,
  ],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const generatedEntries = fs.readdirSync(outputDirectory, {
  withFileTypes: true,
});
const generatedFiles = generatedEntries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name);

// Проверяем, что сборка действительно выпустила и установщик, и portable-версию.
const installerArtifact = generatedFiles.find(
  (fileName) => fileName.endsWith(".exe") && fileName.includes("Setup"),
);
const portableArtifact = generatedFiles.find(
  (fileName) =>
    fileName.endsWith(".exe") &&
    !fileName.includes("Setup") &&
    !fileName.includes("unpacked"),
);

if (!installerArtifact || !portableArtifact) {
  console.error("Не найдены оба обязательных артефакта сборки.");
  console.error(
    `Файлы в ${outputDirectory}: ${generatedFiles.join(", ") || "нет файлов"}`,
  );
  process.exit(1);
}

fs.rmSync(outputDirectory, { recursive: true, force: true });

process.exit(0);
