import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService, type HealthOk } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @SkipThrottle()
  @Get('health')
  getHealth(): HealthOk {
    return this.appService.getHealthOrThrow();
  }
}
