import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Registry, Counter } from 'prom-client';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';
import { ProductService } from '../service/products.service';
import { ProductManager } from '../models/products';
import { PRODUCT_SERVICE_SYMBOL } from '../tokens';
import { getProductsQuerySchema } from '../schema/products.schema';
import { ZodError } from 'zod';
import { createProductSchema } from '../schema/products.schema';
import { QueryFailedError } from 'typeorm';

@injectable()
export class ProductsController {
  private readonly createdResourceCounter: Counter;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ProductManager) private readonly manager: ProductManager,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry,
    @inject(PRODUCT_SERVICE_SYMBOL) private readonly productService: ProductService
  ) {
    const existingMetric = this.metricsRegistry.getSingleMetric('created_resource');

    this.createdResourceCounter =
      (existingMetric as Counter<string>) ??
      new Counter({
        name: 'created_resource',
        help: 'number of created resources',
        registers: [this.metricsRegistry],
      });
  }

  public getProducts: TypedRequestHandlers['getProducts'] = async (req, res, next) => {
    try {
      const hasFilters = Object.keys(req.query ?? {}).length > 0;

      if (!hasFilters) {
        const allProducts = await this.productService.getAllProducts();
        return res.json(allProducts);
      }
      const parsed = getProductsQuerySchema.parse(req.query);
      const productsByQyery = await this.productService.getFilteredProducts(parsed);
      return res.json(productsByQyery);
    } catch (error) {
      return next(error);
    }
  };

  public createProducts: TypedRequestHandlers['POST /products'] = async (req, res, next) => {
    const createdResource = this.manager.createProduct(req.body);
    try {
      const parsedBody = createProductSchema.parse(req.body);
      const createProduct = await this.productService.createProduct({
        name: parsedBody.name,
        bounding_polygon: parsedBody.bounding_polygon,
        type: parsedBody.type,
        consumption_protocol: parsedBody.consumption_protocol,
        consumption_link: parsedBody.consumption_link ?? null,
        description: parsedBody.description ?? null,
        resolution_best: parsedBody.resolution_best ?? null,
        min_zoom: parsedBody.min_zoom ?? null,
        max_zoom: parsedBody.max_zoom ?? null,
      });
      res.status(201).json({
        message: 'New product created',
        // data: createProduct,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({});
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
}
