// import type { Logger } from '@map-colonies/js-logger';
// import { inject, injectable } from 'tsyringe';
// import type { components } from '@openapi';
// import { SERVICES } from '@common/constants';
// import { PRODUCT_REPOSITORY_SYMBOL } from '../tokens';

// const productInstance: ProductModel = {
//   id: '1',
//   name: 'ronin',
//   description: 'can you do a logistics run?',
// };
// const productInstances: ProductsModel = [
//   {
//     id: '1',
//     name: 'ronin',
//     description: 'can you do a logistics run?',
//   },
// ];

// function generateRandomId(): number {
//   const rangeOfIds = 100;
//   return Math.floor(Math.random() * rangeOfIds);
// }

// export type ProductModel = components['schemas']['Product'];
// export type ProductsModel = components['schemas']['Products'];

// @injectable()
// export class ProductManager {
//   public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {}

//   public getProducts(): ProductsModel {
//     this.logger.info({ msg: 'getting resource', count: productInstances.length });

//     return productInstances;
//   }

//   public createProduct(resource: ProductModel): ProductModel {
//     const resourceId = String(generateRandomId());

//     this.logger.info({ msg: 'creating resource', resourceId });

//     return { ...resource, id: resourceId };
//   }

//   public updateProduct(resource: ProductsModel) {}
// }
