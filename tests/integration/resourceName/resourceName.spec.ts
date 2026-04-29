import { jsLogger } from '@map-colonies/js-logger';
import { describe, beforeEach, it, expect, beforeAll } from 'vitest';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, type RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import type { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';

describe('resourceName', function () {
  let requestSender: RequestSender<paths, operations>;

  beforeAll(async function () {
    await initConfig(true);
  });

  beforeEach(async function () {
    const [app] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: await jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });
    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the resource', async function () {
      const response = await requestSender.getProducts();

      expect(response.status).toBe(httpStatusCodes.OK);

      const resource = response.body as paths['/products']['get']['responses'][200]['content']['application/json'];

      expect(response).toSatisfyApiSpec();
      expect(resource.id).toBe('19c7d6ba-3979-46b0-81da-394021756dd0');
      expect(resource.name).toBe('ronin');
      expect(resource.description).toBe('can you do a logistics run?');
    });

    it('should return 200 status code and create the resource', async function () {
      const response = await requestSender.createProducts({
        requestBody: {
          id: '19c7d6ba-3979-46b0-81da-394021756dd0',
          name: 'sssss3',
          description: 'valid description',
          bounding_polygon: {
            type: 'Polygon',
            coordinates: [
              [
                [34.78, 32.08],
                [34.79, 32.08],
                [34.79, 32.09],
                [34.78, 32.08],
              ],
            ],
          },
          consumption_link: null,
          type: 'raster',
          consumption_protocol: 'WMS',
          resolution_best: 1,
          min_zoom: 1,
          max_zoom: 10,
        },
      });

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.CREATED);
    });
  });

  describe('Bad Path', function () {
    // All requests with status code of 400
    it('should in theory test 400 status code', function () {
      expect(true).toBe(true);
    });
  });

  describe('Sad Path', function () {
    // All requests with status code 4XX-5XX
    it('should in theory test 500 status code', function () {
      expect(true).toBe(true);
    });
  });
});
