/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  TransformGetTransformResponse,
  TransformGetTransformStatsResponse,
} from '@elastic/elasticsearch/lib/api/types';
import { elasticsearchServiceMock, loggingSystemMock } from '@kbn/core/server/mocks';
import {
  getRiskScoreLatestIndex,
  getRiskScoreTimeSeriesIndex,
} from '../../../../common/entity_analytics/risk_engine';
import { getTransformOptions } from '../risk_score/configurations';
import {
  scheduleLatestTransformNow,
  scheduleTransformNow,
  upgradeLatestTransformIfNeeded,
  getLatestTransformId,
} from './transforms';

const transformId = 'test_transform_id';

const startedTransformsMock = {
  count: 1,
  transforms: [
    {
      id: 'test_transform_id_1',
      state: 'started',
    },
  ],
} as TransformGetTransformStatsResponse;

const stoppedTransformsMock = {
  count: 1,
  transforms: [
    {
      id: 'test_transform_id_2',
      state: 'stopped',
    },
  ],
} as TransformGetTransformStatsResponse;

const latestIndex = getRiskScoreLatestIndex('tests');
const timeSeriesIndex = getRiskScoreTimeSeriesIndex('tests');
const transformConfig = getTransformOptions({
  dest: latestIndex,
  source: [timeSeriesIndex],
  namespace: 'tests',
});

const updatedTransformsMock = {
  count: 1,
  transforms: [
    {
      id: 'test_transform_id_3',
      ...transformConfig,
    },
  ],
} as TransformGetTransformResponse;

const outdatedTransformsMock = {
  count: 1,
  transforms: [
    {
      ...transformConfig,
      id: 'test_transform_id_3',
      sync: {
        time: {
          field: '@timestamp',
          delay: '2s',
        },
      },
      _meta: {
        version: '1',
      },
    },
  ],
} as TransformGetTransformResponse;
const outdatedTransformsRequiredReinstallMock = {
  count: 1,
  transforms: [
    {
      ...transformConfig,
      id: 'test_transform_id_3',
      sync: {
        time: {
          field: '@timestamp',
          delay: '2s',
        },
      },
      latest: {
        unique_key: ['test'],
        sort: 'desc',
      },
      _meta: {
        version: '1',
      },
    },
  ],
} as TransformGetTransformResponse;

const logger = loggingSystemMock.createLogger();

describe('transforms utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('scheduleTransformNow', () => {
    it('calls startTransform when the transform state is stopped ', async () => {
      const esClient = elasticsearchServiceMock.createScopedClusterClient().asCurrentUser;
      esClient.transform.getTransformStats.mockResolvedValueOnce(stoppedTransformsMock);

      await scheduleTransformNow({ esClient, transformId });

      expect(esClient.transform.startTransform).toHaveBeenCalled();
    });

    it('calls scheduleNowTransform when the transform state is started ', async () => {
      const esClient = elasticsearchServiceMock.createScopedClusterClient().asCurrentUser;
      esClient.transform.getTransformStats.mockResolvedValueOnce(startedTransformsMock);

      await scheduleTransformNow({ esClient, transformId });

      expect(esClient.transform.scheduleNowTransform).toHaveBeenCalled();
    });
  });

  describe('scheduleLatestTransformNow', () => {
    it('update the latest transform when scheduleTransformNow is called and the transform is outdated', async () => {
      const esClient = elasticsearchServiceMock.createScopedClusterClient().asCurrentUser;
      esClient.transform.getTransformStats.mockResolvedValueOnce(stoppedTransformsMock);
      esClient.transform.getTransform.mockResolvedValueOnce(outdatedTransformsMock);

      await scheduleLatestTransformNow({ esClient, namespace: 'tests', logger });

      expect(esClient.transform.updateTransform).toHaveBeenCalled();
    });

    it('does not update the latest transform when scheduleTransformNow is called if the transform is updated', async () => {
      const esClient = elasticsearchServiceMock.createScopedClusterClient().asCurrentUser;
      esClient.transform.getTransformStats.mockResolvedValueOnce(stoppedTransformsMock);
      esClient.transform.getTransform.mockResolvedValueOnce(updatedTransformsMock);

      await scheduleLatestTransformNow({ esClient, namespace: 'tests', logger });

      expect(esClient.transform.updateTransform).not.toHaveBeenCalled();
    });

    it('it logs the error if update transform fails', async () => {
      const esClient = elasticsearchServiceMock.createScopedClusterClient().asCurrentUser;
      esClient.transform.getTransformStats.mockResolvedValueOnce(stoppedTransformsMock);
      esClient.transform.getTransform.mockResolvedValueOnce(outdatedTransformsMock);
      esClient.transform.updateTransform.mockRejectedValueOnce(new Error('Test error'));

      await scheduleLatestTransformNow({ esClient, namespace: 'tests', logger });

      expect(logger.error).toHaveBeenCalledWith(
        'There was an error upgrading the transform risk_score_latest_transform_tests. Continuing with transform scheduling. Test error'
      );
    });

    it('it calls upgradeLatestTransformIfNeeded', async () => {
      const esClient = elasticsearchServiceMock.createScopedClusterClient().asCurrentUser;
      esClient.transform.getTransformStats.mockResolvedValueOnce(stoppedTransformsMock);
      esClient.transform.getTransform.mockResolvedValueOnce(outdatedTransformsMock);

      await scheduleLatestTransformNow({ esClient, namespace: 'tests', logger });

      expect(esClient.transform.updateTransform).toHaveBeenCalled();
    });
  });

  describe('upgradeLatestTransformIfNeeded', () => {
    it('updateTransform the transform if it is outdated', async () => {
      const esClient = elasticsearchServiceMock.createScopedClusterClient().asCurrentUser;
      esClient.transform.getTransform.mockResolvedValueOnce(outdatedTransformsMock);

      await upgradeLatestTransformIfNeeded({ esClient, namespace: 'tests', logger });

      expect(esClient.transform.updateTransform).toHaveBeenCalled();
    });

    it('does not reinstall the transform if it is not outdated', async () => {
      const esClient = elasticsearchServiceMock.createScopedClusterClient().asCurrentUser;
      esClient.transform.getTransform.mockResolvedValueOnce(updatedTransformsMock);

      await upgradeLatestTransformIfNeeded({ esClient, namespace: 'tests', logger });

      expect(esClient.transform.updateTransform).not.toHaveBeenCalled();
    });

    it('reinstalls the transform if it is outdated and requires reinstall', async () => {
      const esClient = elasticsearchServiceMock.createScopedClusterClient().asCurrentUser;

      esClient.transform.getTransform
        .mockResolvedValueOnce(outdatedTransformsRequiredReinstallMock)
        .mockRejectedValueOnce({ statusCode: 404 }); // MAKE IT 404

      await upgradeLatestTransformIfNeeded({ esClient, namespace: 'tests', logger });

      expect(esClient.transform.stopTransform).toHaveBeenCalled();
      expect(esClient.transform.deleteTransform).toHaveBeenCalled();
      expect(esClient.transform.putTransform).toHaveBeenCalled();
    });
  });

  describe('checkTransformNameLength', () => {
    it('should limit the length of tranformId to less than or equal 64 characters', async () => {
      const longTransformId = 'a_a-'.repeat(1000);
      const response = await getLatestTransformId(longTransformId);
      expect(response.length).toBeLessThanOrEqual(36);
    });
  });
});
