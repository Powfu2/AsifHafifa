import { getOtelMixin } from '@map-colonies/tracing-utils';
import { trace } from '@opentelemetry/api';
import { Registry } from 'prom-client';
import type { DependencyContainer } from 'tsyringe/dist/typings/types';
import { jsLogger } from '@map-colonies/js-logger';
import { type InjectionObject, registerDependencies } from '@common/dependencyRegistration';
import { SERVICES, SERVICE_NAME } from '@common/constants';
import { getTracing } from '@common/tracing';
import { PRODUCT_ROUTER_SYMBOL, productRouterFactory } from './products/routes/products';
import { getConfig } from './common/config';
import { AppDataSource } from './common/db/data-source';
import { ProductEntity } from './products/models/entity.products';
import { ProductsController } from './products/controllers/products';
import { ProductManager } from './products/models/products';
import { PRODUCT_CONTROLLER_SYMBOL, PRODUCT_REPOSITORY_SYMBOL, PRODUCT_SERVICE_SYMBOL } from './products/tokens';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const configInstance = getConfig();
  const loggerConfig = configInstance.get('telemetry.logger');
  const logger = await jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });
  const tracer = trace.getTracer(SERVICE_NAME);
  const metricsRegistry = new Registry();
  configInstance.initializeMetrics(metricsRegistry);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },

    { token: PRODUCT_REPOSITORY_SYMBOL, provider: { useFactory: () => AppDataSource.getRepository(ProductEntity) } },
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
