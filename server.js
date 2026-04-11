const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = process.env.PORT || 8080;

const MIME = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".json": "application/json",
  ".ttf":  "font/ttf",
};

const ROUTES = {
  "/":        "index.html",
  "/sketch1": "index.html",
  "/sketch2": "sketch2.html",
  "/sketchOverlay": "sketchOverlay.html",
  "/sketchSplit":   "sketchSplit.html",
  "/pose":    "pose.html",
};

// Static file server
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const filePath = path.join(__dirname, ROUTES[pathname] ?? pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
    res.end(data);
  });
});

// WebSocket sync relay on the same port
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log(`client connected  (total: ${wss.clients.size})`);

  ws.on("message", (data) => {
    for (const client of wss.clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data.toString());
      }
    }
  });

  ws.on("close", () => {
    console.log(`client disconnected (total: ${wss.clients.size})`);
  });
});

server.listen(PORT, () => {
  console.log(`Boscoyo running on http://localhost:${PORT}`);
  console.log(`Sync websocket on ws://localhost:${PORT}`);
});
