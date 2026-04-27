import { And, ILike, MoreThan, LessThan, MoreThanOrEqual, LessThanOrEqual, FindOperator } from 'typeorm';
import { AppDataSource } from '@src/common/db/data-source.js';
import { ProductEntity } from '../models/entity.products.js';
import type { GetProductsQuery } from '../schema/products.schema.js';
import { inject, injectable } from 'tsyringe';
import { PRODUCT_ROUTER_SYMBOL } from '../routes/products.js';
import { PRODUCT_REPOSITORY_SYMBOL } from '../tokens.js';

function buildOperators<T>(ops: FindOperator<T>[]): FindOperator<T> | undefined {
  if (ops.length === 0) return undefined;
  if (ops.length === 1) return ops[0];
  return And(...ops);
}

@injectable()
export class ProductService {
  public constructor(
    @inject(PRODUCT_REPOSITORY_SYMBOL)
    private readonly productService: ProductService
  ) {}

  public async createProduct(data: Partial<ProductEntity>) {
    const repo = AppDataSource.getRepository(ProductEntity);
    const product = repo.create(data);
    const savedProduct = await repo.save(product);
    return savedProduct;
  }

  public async getAllProducts() {
    const repo = AppDataSource.getRepository(ProductEntity);
    return repo.find();
  }

  public async getFilteredProducts(filters: GetProductsQuery) {
    const repo = AppDataSource.getRepository(ProductEntity);
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

    return repo.find({ where });
  }

  public async updateProduct(id: string, data: Partial<ProductEntity>) {
    const repo = AppDataSource.getRepository(ProductEntity);
    const result = await repo.update(id, data);
    if (result.affected === 0) throw new Error(`Product with ID ${id} not found`);
    return result;
  }
}
