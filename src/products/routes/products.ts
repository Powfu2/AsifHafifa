import { Router } from 'express';
import type { FactoryFunction } from 'tsyringe';
import { ProductsController } from '../controllers/products';

export const productRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ProductsController);

  router.get('/', controller.getProducts);

  router.post('/', controller.createProducts);

  // router.put("/:id", controller.updateProducts)

  // router.delete("/:id", controller.deleteProducts)

  return router;
};

export const PRODUCT_ROUTER_SYMBOL = Symbol('productRouterFactory');
