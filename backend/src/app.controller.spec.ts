import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getConnectionToken(),
          useValue: { readyState: 1 },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('should return status ok when database is connected', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        database: 'up',
      });
    });
  });
});
