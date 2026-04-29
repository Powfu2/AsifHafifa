import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Registry, Counter } from 'prom-client';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';
import { ProductManager } from '../models/products';
import { getProductsQuerySchema } from '../schema/products.schema';
import { ZodError } from 'zod';
import { createProductSchema, deleteProductSchema, updateProductSchema } from '../schema/products.schema';
import { QueryFailedError } from 'typeorm';

@injectable()
export class ProductsController {
  private readonly createdProductCounter: Counter;
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ProductManager) private readonly manager: ProductManager,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry
  ) {
    const existingMetric = this.metricsRegistry.getSingleMetric('created_resource');
    this.createdProductCounter =
      (existingMetric as Counter<string>) ??
      new Counter({
        name: 'created_product',
        help: 'number of created products',
        registers: [this.metricsRegistry],
      });
  }

  public getProducts: TypedRequestHandlers['getProducts'] = async (req, res, next) => {
    try {
      const hasFilters = Object.keys(req.query ?? {}).length > 0;
      if (!hasFilters) {
        const allProducts = await this.manager.getAllProducts();
        if (allProducts.length === 0) {
          return res.json({
            message: 'There is no products',
          });
        }
        return res.json(allProducts);
      }

      const parsed = getProductsQuerySchema.parse(req.query);
      const productsByQyery = await this.manager.getFilteredProducts(parsed);
      return res.json(productsByQyery);
    } catch (error) {
      return next(error);
    }
  };

  public createProducts: TypedRequestHandlers['POST /products'] = async (req, res, next) => {
    try {
      const parsedBody = createProductSchema.parse(req.body);
      const createdProduct = await this.manager.createProduct(parsedBody);

      res.status(201).json({
        message: 'New product created',
        id: createdProduct.id,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      } else if (error instanceof QueryFailedError) {
        if (error.driverError.code == '23514' && error.driverError.constraint == 'check_polygon') {
          const field = 'bounding_polygon';
          return res.status(400).json({
            message: 'Invalid polygon, please insert valid polygon',
          });
        }

        return res.status(400).json({
          message: 'Invalid request',
        });
      }
      next(error);
    }
  };

  public updateProduct: TypedRequestHandlers['PUT /products/{id}'] = async (req, res, next) => {
    try {
      const parsedBody = updateProductSchema.parse(req.body);
      const id = req.params.id;
      const updateProduct = await this.manager.updateProduct(id as string, parsedBody);
      res.status(200).json({
        message: `Producet updated`,
        id: id,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          message: error.message,
        });
      } else if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.issues.map((issue) => {
            const field = issue.path.join('.');
            return {
              field: field,
              message: issue.message,
            };
          }),
        });
      } else if (error instanceof QueryFailedError) {
        {
          if (error.driverError.code == '23514' && error.driverError.constraint == 'check_polygon') {
            return res.status(400).json({
              message: 'bounding_polygon broken',
            });
          }
          return res.status(400).json({
            message: 'Invalid request',
          });
        }
      }
      next(error);
    }
  };

  public deleteProduct: TypedRequestHandlers['DELETE /products/{id}'] = async (req, res, next) => {
    try {
      const parsedBody = deleteProductSchema.parse(req.params);
      const id = parsedBody.id;
      const deletedProduct = await this.manager.deleteProduct(id as string);

      return res.json({
        message: `Product ${id} was deleted successfully`,
        data: deletedProduct,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
}
