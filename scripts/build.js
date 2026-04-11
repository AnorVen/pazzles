const esbuild = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");
const sass = require("sass");

const outputDirectory = path.resolve("dist-app");
const packageOutputDirectory = path.resolve("dist");

function buildProject() {
  // Очищаем результаты прошлых сборок, чтобы не копить устаревшие артефакты.
  removeDirectory(packageOutputDirectory, { optional: true });
  removeDirectory(outputDirectory);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const styles = sass.compile(path.resolve("src/scss/styles.scss"), {
    style: "expanded",
  });

  fs.writeFileSync(path.join(outputDirectory, "styles.css"), styles.css);

  esbuild.buildSync({
    entryPoints: ["src/js/app/main.js"],
    bundle: true,
    outfile: path.join(outputDirectory, "app.js"),
    format: "iife",
    target: ["chrome120"],
    sourcemap: false,
    legalComments: "none",
  });

  copySqlJsWasm();
}

if (require.main === module) {
  buildProject();
}

module.exports = { buildProject };

function copySqlJsWasm() {
  const sourcePath = path.resolve("node_modules/sql.js/dist/sql-wasm.wasm");
  const targetPath = path.join(outputDirectory, "sql-wasm.wasm");

  fs.copyFileSync(sourcePath, targetPath);
}

function removeDirectory(targetDirectory, options = {}) {
  const { optional = false } = options;

  try {
    fs.rmSync(targetDirectory, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
  } catch (error) {
    if (optional) {
      console.warn(
        `Не удалось очистить ${path.basename(targetDirectory)}: ${error.message}`,
      );
      return;
    }

    throw error;
  }
}
