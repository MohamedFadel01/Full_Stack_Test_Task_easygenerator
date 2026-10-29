import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configureHttpApp } from './configure-http-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  configureHttpApp(app);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}
await bootstrap();
