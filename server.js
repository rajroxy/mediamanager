/* ═══════════════════════════════════════════════════════════════════
   server.js — ScriptForge static preview server

   The app itself is an Electron shell (main.js). This file only exists
   so the UI in index.html can be opened in a browser for previewing.
   It serves the repo root as-is — no build step, no dependencies.
   ═══════════════════════════════════════════════════════════════════ */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.mp3':  'audio/mpeg',
  '.m4a':  'audio/mp4',
  '.wav':  'audio/wav',
  '.flac': 'audio/flac',
  '.ogg':  'audio/ogg',
  '.aac':  'audio/aac',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mkv':  'video/x-matroska',
  '.mov':  'video/quicktime',
  '.m4v':  'video/mp4',
  '.avi':  'video/x-msvideo',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.txt':  'text/plain; charset=utf-8',
  '.md':   'text/plain; charset=utf-8'
};

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (e) {
    return send(res, 400, 'Bad request');
  }

  if (urlPath === '/') urlPath = '/index.html';

  /* resolve inside ROOT only — no path traversal */
  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    return send(res, 403, 'Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 — not found: ' + urlPath);
    }

    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;

    /* byte-range support so seeking works for imported media */
    if (range && /^bytes=/.test(range)) {
      const [startStr, endStr] = range.replace(/^bytes=/, '').split('-');
      let start = startStr ? parseInt(startStr, 10) : 0;
      let end   = endStr   ? parseInt(endStr, 10)   : stat.size - 1;
      if (isNaN(start) || start < 0) start = 0;
      if (isNaN(end) || end >= stat.size) end = stat.size - 1;
      if (start > end) {
        res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size });
        return res.end();
      }
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Length': end - start + 1,
        'Content-Range': 'bytes ' + start + '-' + end + '/' + stat.size,
        'Accept-Ranges': 'bytes'
      });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(filePath, { start, end }).pipe(res);
    }

    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log('ScriptForge preview → http://' + HOST + ':' + PORT);
});
