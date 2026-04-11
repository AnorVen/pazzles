const esbuild = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");
const sass = require("sass");

const outputDirectory = path.resolve("dist-app");

function buildProject() {
  fs.rmSync(outputDirectory, { recursive: true, force: true });
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
