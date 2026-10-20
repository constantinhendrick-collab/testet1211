
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 10000;
const HOST = "0.0.0.0";

const ZIP_PATH = path.join(__dirname, "build.zip");
const HTML_PATH = path.join(__dirname, "index.html");

const server = http.createServer((req, res) => {
  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("Method not allowed");
    return;
  }

  // Download ZIP file
  if (url.pathname === "/download") {
    fs.stat(ZIP_PATH, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404);
        res.end("ZIP file not found");
        return;
      }

      const randomNumber = Math.floor(
        1000000 + Math.random() * 9000000
      );

      const filename = `report_${randomNumber}.zip`;

      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": stats.size,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store"
      });

      if (req.method === "HEAD") {
        res.end();
        return;
      }

      const stream = fs.createReadStream(ZIP_PATH);

      stream.on("error", () => {
        res.destroy();
      });

      stream.pipe(res);
    });

    return;
  }

  // Main HTML page with Blob behavior added
  if (
    url.pathname === "/" ||
    url.pathname === "/index.html"
  ) {
    if (req.method === "HEAD") {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });
      res.end();
      return;
    }

    fs.readFile(HTML_PATH, "utf8", (err, html) => {
      if (err) {
        res.writeHead(500, {
          "Content-Type": "text/plain; charset=utf-8"
        });
        res.end("Unable to load page");
        return;
      }

      const blobScript = `
<script>
(() => {
  // Do not create another Blob when running inside one.
  if (location.protocol === "blob:") return;

  // Wait until the original page has loaded.
  window.addEventListener("load", () => {
    try {
      const html =
        "<!DOCTYPE html>\\n" +
        document.documentElement.outerHTML;

      const blob = new Blob([html], {
        type: "text/html;charset=utf-8"
      });

      const blobURL = URL.createObjectURL(blob);

      // Open the Blob in a separate tab.
      const opened = window.open(blobURL, "_blank");

      if (!opened) {
        console.warn(
          "The browser blocked the Blob tab. Allow pop-ups and reload."
        );
      }
    } catch (error) {
      console.error("Could not create Blob URL:", error);
    }
  }, { once: true });
})();
</script>
`;

      const outputHTML = html.includes("</body>")
        ? html.replace(
            "</body>",
            blobScript + "\n</body>"
          )
        : html + blobScript;

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      });

      res.end(outputHTML);
    });

    return;
  }

  // Other paths
  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Not found");
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});
