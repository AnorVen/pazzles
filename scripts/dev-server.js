const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { buildProject } = require("./build.js");

const rootDirectory = process.cwd();
const port = Number.parseInt(process.env.PORT || "5173", 10);
const clients = new Set();

buildAndReport();
watchProject();

const server = http.createServer((request, response) => {
  if (request.url === "/__reload") {
    handleReloadStream(request, response);
    return;
  }

  serveFile(request, response);
});

server.listen(port, () => {
  console.log(`Live server: http://localhost:${port}`);
});

function buildAndReport() {
  try {
    buildProject();
    console.log("Build completed");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function watchProject() {
  const watchedPaths = ["src", "index.html", "vendor/headbreaker.js"];
  let timer = null;

  watchedPaths.forEach((watchedPath) => {
    fs.watch(watchedPath, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        buildAndReport();
        reloadClients();
      }, 120);
    });
  });
}

function handleReloadStream(request, response) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  response.write("\n");
  clients.add(response);

  request.on("close", () => {
    clients.delete(response);
  });
}

function reloadClients() {
  clients.forEach((client) => {
    client.write("data: reload\n\n");
  });
}

function serveFile(request, response) {
  const requestUrl = new URL(request.url, `http://localhost:${port}`);
  const requestedPath =
    requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.normalize(path.join(rootDirectory, requestedPath));

  if (!filePath.startsWith(rootDirectory)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const type = getContentType(filePath);
    const body =
      path.basename(filePath) === "index.html"
        ? injectReloadClient(content)
        : content;

    response.writeHead(200, { "Content-Type": type });
    response.end(body);
  });
}

function injectReloadClient(content) {
  const script = `
<script>
  new EventSource("/__reload").onmessage = () => window.location.reload();
</script>`;

  return content.toString().replace("</body>", `${script}</body>`);
}

function getContentType(filePath) {
  const extension = path.extname(filePath);
  const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
  };

  return types[extension] || "application/octet-stream";
}
