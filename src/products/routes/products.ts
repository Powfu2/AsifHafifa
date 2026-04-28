import { Router } from 'express';
import type { FactoryFunction } from 'tsyringe';
import { ProductsController } from '../controllers/products';

export const productRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ProductsController);

  router.get('/', controller.getProducts);

  router.post('/', controller.createProducts);

  router.put('/:id', controller.updateProduct);

  router.delete('/:id', controller.deleteProduct);

  return router;
};

export const PRODUCT_ROUTER_SYMBOL = Symbol('productRouterFactory');
