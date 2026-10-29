import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

const mongoServer = await MongoMemoryServer.create();

const child = spawn(process.execPath, ['dist/main.js'], {
  cwd: backendRoot,
  env: {
    ...process.env,
    MONGODB_URI: mongoServer.getUri(),
    JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-live-server-jwt-secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1h',
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://127.0.0.1:4173',
    PORT: process.env.PORT ?? '3000',
    THROTTLE_LIMIT: process.env.THROTTLE_LIMIT ?? '1000',
    THROTTLE_TTL_MS: process.env.THROTTLE_TTL_MS ?? '60000',
  },
  stdio: 'inherit',
});

const shutdown = async () => {
  child.kill('SIGTERM');
  await mongoServer.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

child.on('exit', (code) => {
  void mongoServer.stop().finally(() => {
    process.exit(code ?? 0);
  });
});
