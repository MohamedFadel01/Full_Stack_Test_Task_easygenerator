import { INestApplication } from '@nestjs/common';
import { configureHttpApp } from '../../src/configure-http-app.js';

export function applyAppConfiguration(app: INestApplication): void {
  configureHttpApp(app);
}
