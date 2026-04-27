import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import type { components } from '@openapi';
import { SERVICES } from '@common/constants';

const resourceInstance: ProductModel = {
  id: '1',
  name: 'ronin',
  description: 'can you do a logistics run?',
};
const resourceInstances: ProductsModel = [
  {
    id: '1',
    name: 'ronin',
    description: 'can you do a logistics run?',
  },
];
function generateRandomId(): number {
  const rangeOfIds = 100;
  return Math.floor(Math.random() * rangeOfIds);
}

export type ProductModel = components['schemas']['Product'];
export type ProductsModel = components['schemas']['Products'];

@injectable()
export class ProductManager {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {}

  public getProducts(): ProductsModel {
    this.logger.info({ msg: 'getting resource', count: resourceInstances.length });

    return resourceInstances;
  }

  public createProduct(resource: ProductModel): ProductModel {
    const resourceId = String(generateRandomId());

    this.logger.info({ msg: 'creating resource', resourceId });

    return { ...resource, id: resourceId };
  }
}
