
const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
  if (req.url === "/download") {
    const filePath = path.join(__dirname, "build.zip");

    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="build.zip"'
    });

    fs.createReadStream(filePath)
      .on("error", () => {
        if (!res.headersSent) {
          res.writeHead(500);
        }
        res.end("Unable to read ZIP file");
      })
      .pipe(res);

    return;
  }

  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    fs.createReadStream(
      path.join(__dirname, "index.html")
    ).pipe(res);

    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(3000, () => {
  console.log("Open http://localhost:3000");
});
