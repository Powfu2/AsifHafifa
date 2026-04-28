import { components } from '@src/openapi';
import { Entity, Column, PrimaryGeneratedColumn, Check } from 'typeorm';
import { ProductModel } from './products.service';
type GeoJsonPolygon = components['schemas']['GeoJsonPolygon'];

export enum ProductType {
  raster = 'raster',
  rasterized_vector = 'rasterized_vector',
  tiles3d = 'tiles3d',
  QMesh = 'QMesh',
}

export enum ConsumptionProtocol {
  WMS = 'WMS',
  WMTS = 'WMTS',
  XYZ = 'XYZ',
  TILES_3D = '3D Tiles',
}

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
    enum: ProductType,
  })
  type!: ProductType;

  @Column({
    type: 'enum',
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
