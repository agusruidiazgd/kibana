/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useMemo } from 'react';
import { useLoadActionTypes as loadActionTypes } from '@kbn/elastic-assistant/impl/connectorland/use_load_action_types';
import { useAssistantContext } from '@kbn/elastic-assistant';
import { AIActionTypeIds } from '../constants';

export const useFilteredActionTypes = () => {
  const { http, toasts } = useAssistantContext();
  const { data } = loadActionTypes({ http, toasts });
  return useMemo(() => data?.filter(({ id }) => AIActionTypeIds.includes(id)), [data]);
};
