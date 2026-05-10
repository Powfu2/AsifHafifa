import { getOtelMixin } from '@map-colonies/tracing-utils';
import { trace } from '@opentelemetry/api';
import { Registry } from 'prom-client';
import { DataSource, Repository } from 'typeorm';
import { instancePerContainerCachingFactory } from 'tsyringe';
import type { DependencyContainer } from 'tsyringe/dist/typings/types';
import { jsLogger, Logger } from '@map-colonies/js-logger';
import { type InjectionObject, registerDependencies } from '@common/dependencyRegistration';
import { SERVICES, SERVICE_NAME } from '@common/constants';
import { getTracing } from '@common/tracing';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { PRODUCT_ROUTER_SYMBOL, productRouterFactory } from './products/routes/products';
import { getConfig, ConfigType } from './common/config';
import { CleanupRegistry } from '@map-colonies/cleanup-registry';
import { ProductEntity } from './products/models/entity.products';
import { ProductsController } from './products/controllers/products';
import { ProductManager } from './products/models/products';
import { PRODUCT_CONTROLLER_SYMBOL } from './products/controllers/products';
import { PRODUCT_REPOSITORY_SYMBOL } from './products/models/entity.products';
import { PRODUCT_SERVICE_SYMBOL } from './products/models/products';
import { DATA_SOURCE_PROVIDER } from './common/db/data-source';
import { dataSourceFactory } from './common/db/data-source';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const cleanupRegistry = new CleanupRegistry();
  const configInstance = getConfig();
  const loggerConfig = configInstance.get('telemetry.logger');
  const logger = await jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });
  const metricsRegistry = new Registry();
  configInstance.initializeMetrics(metricsRegistry);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },

    {
      token: SERVICES.CLEANUP_REGISTRY,
      provider: { useValue: cleanupRegistry },
      postInjectionHook: (container): void => {
        const logger = container.resolve<Logger>(SERVICES.LOGGER);
        const cleanupRegistryLogger = logger.child({ subComponent: 'cleanupRegistry' });
        cleanupRegistry.on('itemFailed', (id, error, msg) => cleanupRegistryLogger.error({ msg, itemId: id, err: error }));
        cleanupRegistry.on('itemCompleted', (id) => cleanupRegistryLogger.info({ itemId: id, msg: 'cleanup finished for item' }));
        cleanupRegistry.on('finished', (status) => cleanupRegistryLogger.info({ msg: `cleanup registry finished cleanup`, status }));
      },
    },
    {
      token: SERVICES.TRACER,
      provider: {
        useFactory: instancePerContainerCachingFactory((container) => {
          const cleanupRegistry = container.resolve<CleanupRegistry>(SERVICES.CLEANUP_REGISTRY);
          cleanupRegistry.register({ id: SERVICES.TRACER, func: getTracing().stop.bind(getTracing()) });
          const tracer = trace.getTracer(SERVICE_NAME);
          return tracer;
        }),
      },
    },
    {
      token: SERVICES.METRICS,
      provider: {
        useFactory: instancePerContainerCachingFactory((container) => {
          const metricsRegistry = new Registry();
          const config = container.resolve<ConfigType>(SERVICES.CONFIG);
          config.initializeMetrics(metricsRegistry);
          return metricsRegistry;
        }),
      },
    },
    {
      token: DATA_SOURCE_PROVIDER,
      provider: {
        useFactory: instancePerContainerCachingFactory(dataSourceFactory),
      },
      postInjectionHook: async (deps: DependencyContainer): Promise<void> => {
        const dataSource = deps.resolve<DataSource>(DATA_SOURCE_PROVIDER);
        if (!dataSource.isInitialized) {
          await dataSource.initialize();
          initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });
          addTransactionalDataSource(dataSource);
          cleanupRegistry.register({ id: DATA_SOURCE_PROVIDER, func: dataSource.destroy.bind(dataSource) });
        }
      },
    },
    {
      token: PRODUCT_REPOSITORY_SYMBOL,
      provider: {
        useFactory(container): Repository<ProductEntity> {
          const dataSource = container.resolve<DataSource>(DATA_SOURCE_PROVIDER);
          return dataSource.getRepository(ProductEntity);
        },
      },
    },

    { token: PRODUCT_SERVICE_SYMBOL, provider: { useClass: ProductManager } },
    { token: PRODUCT_CONTROLLER_SYMBOL, provider: { useClass: ProductsController } },
    { token: PRODUCT_ROUTER_SYMBOL, provider: { useFactory: productRouterFactory } },
    {
      token: 'onSignal',
      provider: {
        useValue: async (): Promise<void> => {
          await Promise.all([getTracing().stop()]);
        },
      },
    },
  ];

  return Promise.resolve(registerDependencies(dependencies, options?.override, options?.useChild));
};
