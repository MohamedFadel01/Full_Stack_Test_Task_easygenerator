import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { configureHttpApp } from './configure-http-app.js';
import { setupSwagger } from './setup-swagger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const configService = app.get(ConfigService);

  configureHttpApp(app);
  setupSwagger(app);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  new Logger('Bootstrap').log(`Listening on http://0.0.0.0:${port}/api`);
}
await bootstrap();
