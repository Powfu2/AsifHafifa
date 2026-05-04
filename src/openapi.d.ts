/* eslint-disable */
// This file was auto-generated. Do not edit manually.
// To update, run the error generation script again.

import type { TypedRequestHandlers as ImportedTypedRequestHandlers } from '@map-colonies/openapi-helpers/typedRequestHandler';
export type paths = {
  '/products': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** gets the resource */
    get: operations['getProducts'];
    put?: never;
    /** creates a new record of type product */
    post: operations['createProduct'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/products/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** update product */
    put: operations['updateProduct'];
    post?: never;
    /** delete product */
    delete: operations['deleteProduct'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
};
export type webhooks = Record<string, never>;
export type components = {
  schemas: {
    GeoJsonPolygon: {
      /** @enum {string} */
      type: 'Polygon';
      coordinates: number[][][];
    };
    error: {
      message?: string;
      data?: Record<string, never>;
      errors?: {
        field?: string;
        message?: string;
      }[];
    };
    Product: {
      /** Format: uuid */
      id?: string;
      name?: string;
      description?: string | null;
      bounding_polygon?: components['schemas']['GeoJsonPolygon'];
      consumption_link?: string | null;
      /** Format: double */
      resolution_best?: number | null;
      min_zoom?: number | null;
      max_zoom?: number | null;
      /** @enum {string} */
      type?: 'raster' | 'rasterized_vector' | 'tiles3d' | 'QMesh';
      /** @enum {string} */
      consumption_protocol?: 'WMS' | 'WMTS' | 'XYZ' | '3D Tiles';
    };
    Products: components['schemas']['Product'][];
    UpdateProduct: {
      name?: string;
      description?: string | null;
      bounding_polygon?: components['schemas']['GeoJsonPolygon'];
      consumption_link?: string | null;
      /** @enum {string} */
      type?: 'raster' | 'rasterized_vector' | 'tiles3d' | 'QMesh';
      /** @enum {string} */
      consumption_protocol?: 'WMS' | 'WMTS' | 'XYZ' | '3D Tiles';
      resolution_best?: number;
      min_zoom?: number;
      max_zoom?: number;
    };
    DeletedProductResponse: {
      data?: components['schemas']['Product'];
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
  getProducts: {
    parameters: {
      query?: {
        name?: string;
        type?: 'raster' | 'rasterized_vector' | 'tiles3d' | 'QMesh';
        description?: string;
        bounding_polygon?: components['schemas']['GeoJsonPolygon'];
        consumption_link?: string;
        resolution_best?: number;
        consumption_protocol?: 'WMS' | 'WMTS' | 'XYZ' | '3D Tiles';
        max_zoom?: number;
        min_zoom?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description A JSON array of products */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Products'];
        };
      };
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
  createProduct: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['Product'];
      };
    };
    responses: {
      /** @description created */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Product'];
        };
      };
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
  updateProduct: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateProduct'];
      };
    };
    responses: {
      /** @description updated */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Product'];
        };
      };
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
      /** @description Product not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
  deleteProduct: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Product deleted */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DeletedProductResponse'];
        };
      };
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
      /** @description Product not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
}
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
