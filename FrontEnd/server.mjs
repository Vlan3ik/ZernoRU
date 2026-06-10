import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT ?? '4173');
const distDir = fileURLToPath(new URL('./dist/', import.meta.url));

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function resolvePath(urlPath) {
  const safePath = decodeURIComponent(urlPath).split('?')[0];
  const normalized = normalize(safePath).replace(/^(\.\.[/\\])+/, '');
  const candidate = join(distDir, normalized);
  return candidate.startsWith(distDir) ? candidate : join(distDir, 'index.html');
}

const server = createServer(async (req, res) => {
  try {
    const requestPath = req.url ?? '/';
    const filePath = resolvePath(requestPath === '/' ? '/index.html' : requestPath);

    let fileToServe = filePath;
    try {
      const stat = await readFile(fileToServe);
      const type = contentTypes[extname(fileToServe)] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(stat);
      return;
    } catch {
      fileToServe = join(distDir, 'index.html');
    }

    const fallback = await readFile(fileToServe);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fallback);
  } catch (error) {
    console.error('Static server error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Static server listening on http://0.0.0.0:${port}`);
});
