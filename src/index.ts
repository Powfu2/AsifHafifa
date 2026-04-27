// this import must be called before the first import of tsyringe
import 'reflect-metadata';
import { createServer } from 'node:http';
import { createTerminus } from '@godaddy/terminus';
import type { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '@common/constants';
import type { ConfigType } from '@common/config';
import { getApp } from './app';
import { AppDataSource } from './common/db/data-source';

void getApp()
  .then(([app, container]) => {
    const logger = container.resolve<Logger>(SERVICES.LOGGER);
    const config = container.resolve<ConfigType>(SERVICES.CONFIG);
    const port = process.env.PORT || 8080;
    const stubHealthCheck = async (): Promise<void> => Promise.resolve();
    const server = createTerminus(createServer(app), { healthChecks: { '/liveness': stubHealthCheck }, onSignal: container.resolve('onSignal') });

    server.listen(port, () => {
      logger.info(`app started on port ${port}`);
    });
  })
  .catch((error: Error) => {
    console.error('😢 - failed initializing the server');
    console.error(error);
    process.exit(1);
  });
