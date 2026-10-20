
if (url.pathname === "/" || url.pathname === "/index.html") {
  if (req.method === "HEAD") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });
    return res.end();
  }

  fs.readFile(HTML_PATH, "utf8", (err, html) => {
    if (err) {
      res.writeHead(500);
      return res.end("Unable to load page");
    }

    // Inject a Blob launcher without changing the original HTML file.
    const launcher = `
<script>
(async function () {
  if (sessionStorage.getItem("blobLaunched") === "1") return;

  // Use the original server-rendered HTML as the Blob content.
  const response = await fetch("/?original=1");
  if (!response.ok) return;

  const source = await response.text();
  const blob = new Blob([source], {
    type: "text/html;charset=utf-8"
  });

  const blobURL = URL.createObjectURL(blob);

  // Display the Blob URL for the user.
  const link = document.createElement("a");
  link.href = blobURL;
  link.target = "_blank";
  link.textContent = "Open Blob version";
  link.style.cssText =
    "position:fixed;bottom:12px;right:12px;z-index:99999;" +
    "background:#173b68;color:white;padding:10px 14px;" +
    "border-radius:6px;text-decoration:none;font:14px Arial";
  document.body.appendChild(link);
})();
</script>`;

    const output = html.includes("</body>")
      ? html.replace("</body>", launcher + "</body>")
      : html + launcher;

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    });

    res.end(output);
  });

  return;
}
