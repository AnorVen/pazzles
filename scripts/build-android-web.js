const fs = require("node:fs");
const path = require("node:path");

const { buildProject } = require("./build.js");

const androidWebDirectory = path.resolve("android-web");
const copyTargets = [
  {
    source: path.resolve("index.html"),
    target: path.join(androidWebDirectory, "index.html"),
  },
  {
    source: path.resolve("dist-app"),
    target: path.join(androidWebDirectory, "dist-app"),
  },
  {
    source: path.resolve("vendor"),
    target: path.join(androidWebDirectory, "vendor"),
  },
];

function buildAndroidWebBundle() {
  // Сначала собираем актуальную веб-версию, чтобы Android-обёртка не тащила старые файлы.
  buildProject({ cleanPackageOutputDirectory: false });

  // Полностью пересобираем каталог для Capacitor, чтобы внутри не оставалось устаревших артефактов.
  fs.rmSync(androidWebDirectory, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200,
  });
  fs.mkdirSync(androidWebDirectory, { recursive: true });

  copyTargets.forEach(({ source, target }) => {
    copyPath(source, target);
  });
}

if (require.main === module) {
  buildAndroidWebBundle();
}

module.exports = { buildAndroidWebBundle };

function copyPath(sourcePath, targetPath) {
  const sourceStat = fs.statSync(sourcePath);

  if (sourceStat.isDirectory()) {
    fs.cpSync(sourcePath, targetPath, {
      recursive: true,
      force: true,
    });
    return;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}
