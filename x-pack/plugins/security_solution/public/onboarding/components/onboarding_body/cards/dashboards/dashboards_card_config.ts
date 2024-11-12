/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import type { CardSelectorListItem } from '../common/card_selector_list';
import { DashboardsCardItemId } from './types';

const VIDEO_SOURCE = '//play.vidyard.com/K6kKDBbP9SpXife9s2tHNP.html?autoplay=1';

export const DASHBOARDS_CARD_ITEMS: CardSelectorListItem[] = [
  {
    id: DashboardsCardItemId.discover,
    title: i18n.translate('xpack.securitySolution.onboarding.dashboardsCard.discover.title', {
      defaultMessage: 'Intro to Elastic Discover',
    }),
    description: i18n.translate(
      'xpack.securitySolution.onboarding.dashboardsCard.discover.description',
      {
        defaultMessage: 'Quickly add and enable the rules you need with Elastic’s prebuilt rules',
      }
    ),
    asset: {
      type: 'video',
      source: VIDEO_SOURCE,
      alt: 'discover_video',
    },
  },
];

export const DASHBOARDS_CARD_ITEMS_BY_ID = Object.fromEntries(
  DASHBOARDS_CARD_ITEMS.map((card) => [card.id, card])
) as Record<CardSelectorListItem['id'], CardSelectorListItem>;
