import 'dotenv/config';
import app from './app.js';
import { jwtSecret } from './middleware/auth.js';
import { prisma } from './utils/prisma.js';

jwtSecret();
const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT дұрыс емес');
await prisma.$connect();
const server = app.listen(port, '0.0.0.0', () =>
  console.log(`КӘСІПОДАҚ API: http://localhost:${port}`),
);
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
