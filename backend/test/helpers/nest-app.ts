import { INestApplication } from '@nestjs/common';
import { configureHttpApp } from '../../src/configure-http-app.js';
import { setupSwagger } from '../../src/setup-swagger.js';

export function applyAppConfiguration(app: INestApplication): void {
  configureHttpApp(app);
  setupSwagger(app);
}
