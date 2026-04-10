const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

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
    "--dir",
    `--config.directories.output=${outputDirectory}`,
  ],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

if (result.status === 0) {
  fs.rmSync(outputDirectory, { recursive: true, force: true });
}

process.exit(result.status ?? 1);
