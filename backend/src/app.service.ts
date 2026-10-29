import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

export type HealthOk = { status: 'ok'; database: 'up' };
export type HealthDegraded = { status: 'degraded'; database: 'down' };
export type HealthResponse = HealthOk | HealthDegraded;

@Injectable()
export class AppService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getHealth(): HealthResponse {
    if (this.connection.readyState === 1) {
      return { status: 'ok', database: 'up' };
    }
    return { status: 'degraded', database: 'down' };
  }

  getHealthOrThrow(): HealthOk {
    const health = this.getHealth();
    if (health.status === 'degraded') {
      throw new ServiceUnavailableException(health);
    }
    return health;
  }
}
