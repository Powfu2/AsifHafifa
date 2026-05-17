import 'reflect-metadata';
import { hostname } from 'os';
import { readFileSync } from 'fs';
import { HealthCheck } from '@godaddy/terminus';
import { DependencyContainer, FactoryFunction } from 'tsyringe';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ProductEntity } from '@src/products/models/entity.products';
import { DbConfig } from '../interfaces';
import { promiseTimeout } from '../utils/promiseTimeout';
import { ConfigType } from '../config';
import { SERVICES } from '../constants';

let connectionSingleton: DataSource | undefined;

const DB_TIMEOUT = 5000;

export const DATA_SOURCE_PROVIDER = Symbol('dataSourceProvider');

export const createDataSourceOptions = (dbConfig: DbConfig): DataSourceOptions => {
  const { enableSslAuth, sslPaths, ...dataSourceOptions } = dbConfig;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dataSourceOptions.extra = { application_name: `${hostname()}-${process.env.NODE_ENV ?? 'unknown_env'}` };
  if (enableSslAuth && dataSourceOptions.type === 'postgres') {
    dataSourceOptions.password = undefined;
    dataSourceOptions.ssl = { key: readFileSync(sslPaths.key), cert: readFileSync(sslPaths.cert), ca: readFileSync(sslPaths.ca) };
  }
  return { ...dataSourceOptions, entities: [ProductEntity, '**/models/*.js'] };
};

export const getCachedDataSource = (dbConfig: DbConfig): DataSource => {
  if (connectionSingleton === undefined) {
    connectionSingleton = new DataSource(createDataSourceOptions(dbConfig));
  }
  return connectionSingleton;
};

export const getDbHealthCheckFunction = (connection: DataSource): HealthCheck => {
  return async (): Promise<void> => {
    const check = connection.query('SELECT 1').then(() => {
      return;
    });
    return promiseTimeout<void>(DB_TIMEOUT, check);
  };
};

export const dataSourceFactory: FactoryFunction<DataSource> = (container: DependencyContainer): DataSource => {
  const config = container.resolve<ConfigType>(SERVICES.CONFIG);
  const dbConfig = config.get('db') as DbConfig;
  const dataSource = getCachedDataSource(dbConfig);
  return dataSource;
};
