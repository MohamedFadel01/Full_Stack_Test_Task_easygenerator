import { ServiceUnavailableException } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service.js';

describe('AppService', () => {
  let appService: AppService;

  async function createService(readyState: number): Promise<AppService> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getConnectionToken(),
          useValue: { readyState },
        },
      ],
    }).compile();
    return module.get(AppService);
  }

  it('reports database up when mongoose readyState is 1', async () => {
    appService = await createService(1);
    expect(appService.getHealth()).toEqual({ status: 'ok', database: 'up' });
  });

  it('reports degraded when mongoose is not connected', async () => {
    appService = await createService(0);
    expect(appService.getHealth()).toEqual({
      status: 'degraded',
      database: 'down',
    });
  });

  it('throws ServiceUnavailableException when database is down', async () => {
    appService = await createService(2);
    expect(() => appService.getHealthOrThrow()).toThrow(
      ServiceUnavailableException,
    );
    try {
      appService.getHealthOrThrow();
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toEqual({
        status: 'degraded',
        database: 'down',
      });
    }
  });
});
