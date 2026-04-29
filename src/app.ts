import type { Application } from 'express';
import type { DependencyContainer } from 'tsyringe';
import { registerExternalValues, type RegisterOptions } from './containerConfig';
import { ServerBuilder } from './serverBuilder';
import { AppDataSource } from './common/db/data-source';

async function getApp(registerOptions?: RegisterOptions): Promise<[Application, DependencyContainer]> {
  const container = await registerExternalValues(registerOptions);

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.info('DB connected');
    }
  } catch (err) {
    console.error('DB connection error:', err);
    throw err;
  }

  const app = container.resolve(ServerBuilder).build();
  return [app, container];
}

export { getApp };
