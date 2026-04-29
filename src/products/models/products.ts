import { And, ILike, MoreThan, LessThan, MoreThanOrEqual, LessThanOrEqual, FindOperator, Repository } from 'typeorm';
import type { Logger } from '@map-colonies/js-logger';
import type { components } from '@openapi';
import { SERVICES } from '@common/constants';
import { AppDataSource } from '@src/common/db/data-source.js';
import { ProductEntity } from './entity.products.js';
import type { GetProductsQuery } from '../schema/products.schema.js';
import { inject, injectable } from 'tsyringe';
import { PRODUCT_REPOSITORY_SYMBOL } from '../tokens.js';

function buildOperators<T>(ops: FindOperator<T>[]): FindOperator<T> | undefined {
  if (ops.length === 0) return undefined;
  if (ops.length === 1) return ops[0];
  return And(...ops);
}

export type ProductModel = components['schemas']['Product'];
export type ProductsModel = components['schemas']['Products'];

@injectable()
export class ProductManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(PRODUCT_REPOSITORY_SYMBOL) private readonly repository: Repository<ProductEntity>
  ) {}

  public async getAllProducts(): Promise<ProductsModel> {
    return await this.repository.find();
  }

  public async getFilteredProducts(filters: GetProductsQuery) {
    const where: Partial<Record<keyof ProductEntity, any>> = {};

    if (filters.name) where.name = ILike(`%${filters.name}%`);
    if (filters.type) where.type = filters.type;
    if (filters.consumption_protocol) where.consumption_protocol = filters.consumption_protocol;

    const resolutionOps: FindOperator<number>[] = [];
    if (filters.resolution_best_gt !== undefined) resolutionOps.push(MoreThan(filters.resolution_best_gt));
    if (filters.resolution_best_lt !== undefined) resolutionOps.push(LessThan(filters.resolution_best_lt));
    if (filters.resolution_best_gte !== undefined) resolutionOps.push(MoreThanOrEqual(filters.resolution_best_gte));
    if (filters.resolution_best_lte !== undefined) resolutionOps.push(LessThanOrEqual(filters.resolution_best_lte));
    const resolution = buildOperators(resolutionOps);
    if (resolution) where.resolution_best = resolution;

    const minZoomOps: FindOperator<number>[] = [];
    if (filters.min_zoom_gt !== undefined) minZoomOps.push(MoreThan(filters.min_zoom_gt));
    if (filters.min_zoom_lt !== undefined) minZoomOps.push(LessThan(filters.min_zoom_lt));
    if (filters.min_zoom_gte !== undefined) minZoomOps.push(MoreThanOrEqual(filters.min_zoom_gte));
    if (filters.min_zoom_lte !== undefined) minZoomOps.push(LessThanOrEqual(filters.min_zoom_lte));
    const minZoom = buildOperators(minZoomOps);
    if (minZoom) where.min_zoom = minZoom;

    const maxZoomOps: FindOperator<number>[] = [];
    if (filters.max_zoom_gt !== undefined) maxZoomOps.push(MoreThan(filters.max_zoom_gt));
    if (filters.max_zoom_lt !== undefined) maxZoomOps.push(LessThan(filters.max_zoom_lt));
    if (filters.max_zoom_gte !== undefined) maxZoomOps.push(MoreThanOrEqual(filters.max_zoom_gte));
    if (filters.max_zoom_lte !== undefined) maxZoomOps.push(LessThanOrEqual(filters.max_zoom_lte));
    const maxZoom = buildOperators(maxZoomOps);
    if (maxZoom) where.max_zoom = maxZoom;

    return await this.repository.find({ where });
  }

  public async createProduct(data: Partial<ProductEntity>) {
    const productToCreate = {
      name: data.name,
      bounding_polygon: data.bounding_polygon,
      type: data.type,
      consumption_protocol: data.consumption_protocol,
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
    if (result.affected === 0) throw new Error(`ID: ${id} not found`);
    return result;
  }

  public async deleteProduct(id: string) {
    const productRemove = await this.repository.findOneBy({
      id: id,
    });
    if (!productRemove) {
      throw Error('Product not found');
    }
    await this.repository.remove(productRemove);
    return productRemove;
  }
}
