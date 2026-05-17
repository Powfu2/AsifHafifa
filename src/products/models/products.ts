import { And, ILike, MoreThan, LessThan, MoreThanOrEqual, LessThanOrEqual, FindOperator, Repository } from 'typeorm';
import type { Logger } from '@map-colonies/js-logger';
import type { components } from '@openapi';
import { SERVICES } from '@common/constants';
import { ProductEntity } from './entity.products.js';
import type { GetProductsQuery } from '../schema/products.schema.js';
import { inject, injectable } from 'tsyringe';
import { PRODUCT_REPOSITORY_SYMBOL } from './entity.products.js';
import type { Tracer } from '@opentelemetry/api';
import { ProductsModel } from './entity.products.js';
import { EmeptyResponse, ProductNotFound } from '@src/common/errors.js';
import { Registry as PromRegistry, Histogram, Counter as PromCounter } from 'prom-client';
import { handleSpanOnSuccess, handleSpanOnError } from '@src/common/tracing/util.js';

//buildOperators get array of TypeORM query operators and combines them into single operator,
function buildOperators<T>(ops: FindOperator<T>[]): FindOperator<T> | undefined {
  if (ops.length === 0) return undefined;
  if (ops.length === 1) return ops[0];
  return And(...ops);
}

function buildNumericOperator(gt?: number, lt?: number, gte?: number, lte?: number): FindOperator<number> | undefined {
  const operatorsCollection: FindOperator<number>[] = [];
  if (gt !== undefined) operatorsCollection.push(MoreThan(gt));
  if (lt !== undefined) operatorsCollection.push(LessThan(lt));
  if (gte !== undefined) operatorsCollection.push(MoreThanOrEqual(gte));
  if (lte !== undefined) operatorsCollection.push(LessThanOrEqual(lte));
  const result = buildOperators(operatorsCollection);
  return result;
}

@injectable()
export class ProductManager {
  private readonly operationCounter?: PromCounter;
  private readonly operationDurationHistogram?: Histogram;

  public constructor(
    @inject(SERVICES.TRACER) private readonly tracer: Tracer,
    @inject(PRODUCT_REPOSITORY_SYMBOL) private readonly repository: Repository<ProductEntity>,
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.METRICS) private readonly registry?: PromRegistry
  ) {
    if (registry !== undefined) {
      this.operationCounter = new PromCounter({
        name: 'product_operation_count',
        help: 'Total number of product CRUD operations',
        labelNames: ['operation', 'status'] as const,
        registers: [registry],
      });

      this.operationDurationHistogram = new Histogram({
        name: 'product_operation_duration_seconds',
        help: 'Duration of product operations in seconds',
        labelNames: ['operation'] as const,
        buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
        registers: [registry],
      });
    }
  }

  public async getAllProducts(): Promise<ProductsModel> {
    return this.tracer.startActiveSpan('product.getAll', { attributes: { 'http.method': 'GET' } }, async (span) => {
      try {
        const allProducts = await this.repository.find();
        span.setAttribute('products.count', allProducts.length);
        span.setAttribute('db.operation', 'find');
        span.setAttribute('db.table', 'products');
        if (allProducts.length === 0) {
          throw new EmeptyResponse('There is no products.');
        }
        handleSpanOnSuccess(span);
        return allProducts;
      } catch (error) {
        handleSpanOnError(span, error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  public async getFilteredProducts(filters: GetProductsQuery) {
    return this.tracer.startActiveSpan('product.getFilteredProducts', { attributes: { 'http.method': 'GET' } }, async (span) => {
      try {
        const where: Partial<Record<keyof ProductEntity, any>> = {};

        span.setAttribute('db.operation', 'find');
        span.setAttribute('db.table', 'products');
        span.setAttribute('filter.name', filters.name ?? 'none');
        span.setAttribute('filter.type', filters.type ?? 'none');
        span.setAttribute('filter.count', Object.keys(filters).filter((k) => filters[k as keyof GetProductsQuery] !== undefined).length);

        if (filters.name) where.name = `${filters.name}`;
        if (filters.type) where.type = filters.type;
        if (filters.consumption_protocol) where.consumption_protocol = filters.consumption_protocol;

        const resolution = buildNumericOperator(
          filters.resolution_best_gt,
          filters.resolution_best_lt,
          filters.resolution_best_gte,
          filters.resolution_best_lte
        );
        if (resolution) where.resolution_best = resolution;

        const minZoomOps = buildNumericOperator(filters.min_zoom_gt, filters.min_zoom_lt, filters.min_zoom_gte, filters.min_zoom_lte);
        if (minZoomOps) where.min_zoom = minZoomOps;

        const maxZoomsOps = buildNumericOperator(filters.max_zoom_gt, filters.max_zoom_lt, filters.max_zoom_gte, filters.max_zoom_lte);
        if (maxZoomsOps) where.max_zoom = maxZoomsOps;

        handleSpanOnSuccess(span);
        return await this.repository.find({ where });
      } catch (error) {
        handleSpanOnError(span, error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  public async createProduct(data: Partial<ProductEntity>) {
    return this.tracer.startActiveSpan('product.create', async (span) => {
      try {
        span.setAttribute('db.operation', 'insert');
        span.setAttribute('db.table', 'products');
        span.setAttribute('product.type', data.type ?? 'unknown');

        const productToCreate = {
          ...data,
          consumption_link: data.consumption_link ?? null,
          description: data.description ?? null,
          resolution_best: data.resolution_best ?? null,
          min_zoom: data.min_zoom ?? null,
          max_zoom: data.max_zoom ?? null,
        };

        const product = this.repository.create(productToCreate);
        const savedProduct = await this.repository.save(product);

        span.setAttribute('product.id', savedProduct.id);

        handleSpanOnSuccess(span);
        return savedProduct;
      } catch (error) {
        handleSpanOnError(span, error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  public async updateProduct(id: string, data: Partial<ProductEntity>) {
    return this.tracer.startActiveSpan('product.update', async (span) => {
      try {
        span.setAttribute('db.operation', 'update');
        span.setAttribute('db.table', 'products');
        span.setAttribute('product.id', id);
        span.setAttribute('update.fields', Object.keys(data).join(', '));

        const productToUpdate = {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.bounding_polygon !== undefined && { bounding_polygon: data.bounding_polygon }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.consumption_protocol !== undefined && { consumption_protocol: data.consumption_protocol }),
          ...(data.consumption_link !== undefined && { consumption_link: data.consumption_link }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.resolution_best !== undefined && { resolution_best: data.resolution_best }),
          ...(data.min_zoom !== undefined && { min_zoom: data.min_zoom }),
          ...(data.max_zoom !== undefined && { max_zoom: data.max_zoom }),
        };

        const result = await this.repository.update(id, productToUpdate);

        span.setAttribute('db.affected_rows', result.affected ?? 0);

        if (result.affected === 0) throw new ProductNotFound(`Cant update is: ${id}, id was not found`);

        handleSpanOnSuccess(span);
        return result;
      } catch (error) {
        handleSpanOnError(span, error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  public async deleteProduct(id: string) {
    return this.tracer.startActiveSpan('product.delete', async (span) => {
      try {
        span.setAttribute('db.operation', 'delete');
        span.setAttribute('db.table', 'products');
        span.setAttribute('product.id', id);

        const productRemove = await this.repository.findOneBy({ id });

        if (!productRemove) {
          throw new ProductNotFound(`Cant delete ${id}, was not found`);
        }

        await this.repository.remove(productRemove);

        span.setAttribute('product.name', productRemove.name);
        span.setAttribute('product.type', productRemove.type);

        handleSpanOnSuccess(span);
        return productRemove;
      } catch (error) {
        handleSpanOnError(span, error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
}

export const PRODUCT_SERVICE_SYMBOL = Symbol('ProductService');
