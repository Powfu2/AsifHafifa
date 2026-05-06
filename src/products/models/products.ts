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

//buildOperators get array of TypeORM query operators and combines them into single operator,
// return undefined if emepty.
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
  public constructor(
    @inject(SERVICES.TRACER) private readonly tracer: Tracer,
    @inject(PRODUCT_REPOSITORY_SYMBOL) private readonly repository: Repository<ProductEntity>,
    @inject(SERVICES.LOGGER) private readonly logger: Logger
  ) {}

  public async getAllProducts(): Promise<ProductsModel> {
    const allProducts = await this.repository.find();

    if (allProducts.length === 0) {
      throw new EmeptyResponse('There is no products.');
    }
    return allProducts;
  }

  public async getFilteredProducts(filters: GetProductsQuery) {
    const where: Partial<Record<keyof ProductEntity, any>> = {};

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

    return await this.repository.find({ where });
  }

  public async createProduct(data: Partial<ProductEntity>) {
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
    return savedProduct;
  }

  public async updateProduct(id: string, data: Partial<ProductEntity>) {
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
    if (result.affected === 0) throw new ProductNotFound(`Cant update is: ${id}, id was not found`);
    return result;
  }

  public async deleteProduct(id: string) {
    const productRemove = await this.repository.findOneBy({
      id: id,
    });
    if (!productRemove) {
      throw new ProductNotFound(`Cant delete ${id},  was not found`);
    }
    await this.repository.remove(productRemove);
    return productRemove;
  }
}

export const PRODUCT_SERVICE_SYMBOL = Symbol('ProductService');
