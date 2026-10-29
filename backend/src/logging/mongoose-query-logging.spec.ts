import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { attachMongooseQueryLogging } from './mongoose-query-logging.js';

describe('attachMongooseQueryLogging', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
  });

  it('registers mongoose debug handler that logs collection operations', () => {
    const connection = {
      set: vi.fn(),
    };

    attachMongooseQueryLogging(connection as never);

    expect(connection.set).toHaveBeenCalledWith('debug', expect.any(Function));

    const debugHandler = connection.set.mock.calls[0]?.[1] as (
      collection: string,
      method: string,
      ...args: unknown[]
    ) => void;

    debugHandler('users', 'findOne', { email: 'a@b.com' });

    expect(logSpy).toHaveBeenCalledWith('users.findOne {"email":"a@b.com"}');
  });
});
