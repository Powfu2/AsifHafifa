import { z } from 'zod';
import { ProductType, ConsumptionProtocol } from '../models/entity.products';

// export const =

export const expectedSchema = {
  name: 'string',
  description: 'string',
  bounding_polygon: 'GeoJSON Polygon',
  type: 'ProductType (raster | rasterized_vector | tiles3d | QMesh)',
  consumption_protocol: 'ConsumptionProtocol (WMS | WMTS | XYZ | 3D Tiles)',
  resolution_best: 'number',
  min_zoom: 'number',
  max_zoom: 'number',
  consumption_link: 'string | null (optional)',
};

export const deletingProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(48),
  description: z.string().trim().max(5000),
  bounding_polygon: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
  }),
  consumption_link: z.string().nullable().optional(),
  type: z.nativeEnum(ProductType),
  consumption_protocol: z.nativeEnum(ConsumptionProtocol),
  resolution_best: z.number(),
  min_zoom: z.number().int(),
  max_zoom: z.number().int(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(48),
  description: z.string().trim().max(5000),
  bounding_polygon: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
  }),
  consumption_link: z.string().nullable().optional(),
  type: z.nativeEnum(ProductType),
  consumption_protocol: z.nativeEnum(ConsumptionProtocol),
  resolution_best: z.number(),
  min_zoom: z.number().int(),
  max_zoom: z.number().int(),
});

export const updateProductSchema = createProductSchema.partial();

export const deleteProductSchema = deletingProductSchema.partial();

export const getProductsQuerySchema = z.object({
  name: z.string().optional(),
  type: z.nativeEnum(ProductType).optional(),
  consumption_protocol: z.nativeEnum(ConsumptionProtocol).optional(),
  resolution_best_gt: z.coerce.number().optional(),
  resolution_best_lt: z.coerce.number().optional(),
  resolution_best_gte: z.coerce.number().optional(),
  resolution_best_lte: z.coerce.number().optional(),
  min_zoom_gt: z.coerce.number().int().optional(),
  min_zoom_lt: z.coerce.number().int().optional(),
  min_zoom_gte: z.coerce.number().int().optional(),
  min_zoom_lte: z.coerce.number().int().optional(),
  max_zoom_gt: z.coerce.number().int().optional(),
  max_zoom_lt: z.coerce.number().int().optional(),
  max_zoom_gte: z.coerce.number().int().optional(),
  max_zoom_lte: z.coerce.number().int().optional(),
});

export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;

export const expectedQuerySchema = {
  name: 'string — partial match on product name',
  type: 'enum — exact match (raster | rasterized_vector | tiles3d | QMesh)',
  consumption_protocol: 'enum — exact match (WMS | WMTS | XYZ | 3D Tiles)',
  resolution_best_gt: 'number — resolution_best greater than',
  resolution_best_lt: 'number — resolution_best less than',
  resolution_best_gte: 'number — resolution_best greater than or equal',
  resolution_best_lte: 'number — resolution_best less than or equal',
  min_zoom_gt: 'integer — min_zoom greater than',
  min_zoom_lt: 'integer — min_zoom less than',
  min_zoom_gte: 'integer — min_zoom greater than or equal',
  min_zoom_lte: 'integer — min_zoom less than or equal',
  max_zoom_gt: 'integer — max_zoom greater than',
  max_zoom_lt: 'integer — max_zoom less than',
  max_zoom_gte: 'integer — max_zoom greater than or equal',
  max_zoom_lte: 'integer — max_zoom less than or equal',
};
