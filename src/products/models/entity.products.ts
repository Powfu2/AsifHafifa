import { components } from '@src/openapi';
import { Entity, Column, PrimaryGeneratedColumn, Check } from 'typeorm';

type GeoJsonPolygon = components['schemas']['GeoJsonPolygon'];
export type ProductModel = components['schemas']['Product'];
export type ProductsModel = components['schemas']['Products'];

export const ProductType = {
  raster: 'raster',
  rasterized_vector: 'rasterized_vector',
  tiles3d: 'tiles3d',
  QMesh: 'QMesh',
} as const satisfies Record<string, string>;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const ConsumptionProtocol = {
  WMS: 'WMS',
  WMTS: 'WMTS',
  XYZ: 'XYZ',
  TILES_3D: '3D Tiles',
} as const satisfies Record<string, string>;
export type ConsumptionProtocol = (typeof ConsumptionProtocol)[keyof typeof ConsumptionProtocol];

@Entity({ name: 'products' })
@Check(`check_polygon`, `ST_IsValid(bounding_polygon)`)
@Check('check_min_zoom_positive', 'min_zoom >= 0')
@Check('check_max_zoom_positive', 'max_zoom >= 0')
@Check('check_zoom_range', 'min_zoom <= max_zoom')
export class ProductEntity implements ProductModel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 48 })
  name!: string;

  @Column({ type: 'text' })
  description!: string | null;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  bounding_polygon!: GeoJsonPolygon;

  @Column({ type: 'text', nullable: true })
  consumption_link!: string | null;

  @Column({
    type: 'enum',
    nullable: true,
    enum: ProductType,
  })
  type!: ProductType;

  @Column({
    type: 'enum',
    nullable: true,
    enum: ConsumptionProtocol,
  })
  consumption_protocol!: ConsumptionProtocol;

  @Column({ type: 'float' })
  resolution_best!: number | null;

  @Column({ type: 'integer' })
  min_zoom!: number | null;

  @Column({ type: 'integer' })
  max_zoom!: number | null;
}
