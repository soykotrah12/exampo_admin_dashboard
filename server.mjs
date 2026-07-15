import { createServer } from 'node:http';
import { parse } from 'node:url';

process.env.NODE_ENV ||= 'production';

const { default: next } = await import('next');

const port = Number.parseInt(process.env.PORT || '8080', 10);
const hostname = '0.0.0.0';
const dev = process.env.NODE_ENV === 'development';

console.log('Admin dashboard starting on port', process.env.PORT || 8080);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url || '/', true);
  handle(req, res, parsedUrl);
});

server.on('error', (error) => {
  console.error('Admin dashboard server error', error);
  process.exitCode = 1;
});

process.on('uncaughtException', (error) => {
  console.error('Admin dashboard uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Admin dashboard unhandled rejection', reason);
  process.exit(1);
});

process.on('exit', (code) => {
  console.log('Admin dashboard process exiting with code', code);
});

server.listen(port, hostname, () => {
  console.log(`Admin dashboard ready on http://${hostname}:${port}`);
});
