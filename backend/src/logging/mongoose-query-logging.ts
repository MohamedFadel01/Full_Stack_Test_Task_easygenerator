import { Logger } from '@nestjs/common';
import type { Connection } from 'mongoose';

const mongoLogger = new Logger('MongoDB');

export function attachMongooseQueryLogging(connection: Connection): Connection {
  connection.set(
    'debug',
    (collectionName: string, method: string, ...args: unknown[]) => {
      const filter =
        args.length > 0 && args[0] !== undefined
          ? ` ${JSON.stringify(args[0])}`
          : '';
      mongoLogger.log(`${collectionName}.${method}${filter}`);
    },
  );
  return connection;
}
