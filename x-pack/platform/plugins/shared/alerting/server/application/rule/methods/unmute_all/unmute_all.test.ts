/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RulesClientContext } from '../../../../rules_client';
import { unmuteAll } from './unmute_all';
import { savedObjectsRepositoryMock } from '@kbn/core-saved-objects-api-server-mocks';

jest.mock('../../../../lib/retry_if_conflicts', () => ({
  retryIfConflicts: (_: unknown, id: unknown, asyncFn: () => Promise<unknown>) => {
    return asyncFn();
  },
}));

jest.mock('../../../../rules_client/lib', () => ({
  updateMetaAttributes: () => {},
}));

jest.mock('../../../../saved_objects', () => ({
  partiallyUpdateRule: async () => {},
}));

const loggerErrorMock = jest.fn();
const getBulkMock = jest.fn();

const savedObjectsMock = savedObjectsRepositoryMock.create();
savedObjectsMock.get = jest.fn().mockReturnValue({
  attributes: {
    actions: [],
  },
  version: '9.0.0',
});

const context = {
  logger: { error: loggerErrorMock },
  getActionsClient: () => {
    return {
      getBulk: getBulkMock,
    };
  },
  unsecuredSavedObjectsClient: savedObjectsMock,
  authorization: { ensureAuthorized: async () => {} },
  ruleTypeRegistry: {
    ensureRuleTypeEnabled: () => {},
  },
  getUserName: async () => {},
} as unknown as RulesClientContext;

describe('validate unmuteAll parameters', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not throw an error for valid params', () => {
    const validParams = {
      id: 'ble',
    };

    expect(() => unmuteAll(context, validParams)).not.toThrow();
    expect(savedObjectsMock.get).toHaveBeenCalled();
  });

  it('should throw Boom.badRequest for invalid params', async () => {
    const invalidParams = {
      id: 22,
    };

    // @ts-expect-error wrong type for testing purposes
    await expect(unmuteAll(context, invalidParams)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Error validating unmute all parameters - [id]: expected value of type [string] but got [number]"`
    );
  });
});
