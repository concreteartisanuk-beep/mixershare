const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // Handle POST form submissions
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      console.log(`[Form Submission Received] URL: ${req.url}, Data: ${body}`);
      const isAjax = req.headers['content-type']?.includes('urlencoded') || req.headers['accept']?.includes('json');
      if (isAjax) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "Submission received successfully" }));
      } else {
        res.writeHead(303, { 'Location': '/success.html' });
        res.end();
      }
    });
    return;
  }

  let filePath = path.join(PUBLIC_DIR, reqPath === '/' ? 'index.html' : reqPath);
  let ext = path.extname(filePath);
  let contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`MixerShare App running at http://localhost:${PORT}`);
});
