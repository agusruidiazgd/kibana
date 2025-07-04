/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTabbedContent,
  EuiTabbedContentTab,
} from '@elastic/eui';
import { FilterGroupHandler } from '@kbn/alerts-ui-shared';
import { i18n } from '@kbn/i18n';
import type { RuleTypeParams } from '@kbn/alerting-plugin/common';
import type { Rule } from '@kbn/triggers-actions-ui-plugin/public';
import type { BoolQuery, Filter } from '@kbn/es-query';
import { ObservabilityAlertsTable } from '../../../components/alerts_table/alerts_table';
import { observabilityAlertFeatureIds } from '../../../../common';
import { useKibana } from '../../../utils/kibana_react';
import { ObservabilityAlertSearchbarWithUrlSync } from '../../../components/alert_search_bar/alert_search_bar_with_url_sync';
import {
  RULE_DETAILS_ALERTS_TAB,
  RULE_DETAILS_EXECUTION_TAB,
  RULE_DETAILS_ALERTS_SEARCH_BAR_ID,
  RULE_DETAILS_PAGE_ID,
  RULE_DETAILS_SEARCH_BAR_URL_STORAGE_KEY,
} from '../constants';
import type { TabId } from '../rule_details';
import { getColumns } from '../../../components/alerts_table/common/get_columns';

interface Props {
  activeTabId: TabId;
  esQuery:
    | {
        bool: BoolQuery;
      }
    | undefined;
  ruleTypeIds?: string[];
  rule: Rule<RuleTypeParams>;
  ruleId: string;
  ruleType: any;
  onEsQueryChange: (query: { bool: BoolQuery }) => void;
  onSetTabId: (tabId: TabId) => void;
  onControlApiAvailable?: (controlGroupHandler: FilterGroupHandler | undefined) => void;
  controlApi?: FilterGroupHandler;
}

const tableColumns = getColumns();

export function RuleDetailsTabs({
  activeTabId,
  esQuery,
  ruleTypeIds,
  rule,
  ruleId,
  ruleType,
  onSetTabId,
  onEsQueryChange,
  onControlApiAvailable,
  controlApi,
}: Props) {
  const {
    data,
    http,
    notifications,
    fieldFormats,
    application,
    licensing,
    cases,
    settings,
    triggersActionsUi: { getRuleEventLogList: RuleEventLogList },
  } = useKibana().services;
  const [filterControls, setFilterControls] = useState<Filter[] | undefined>();
  const hasInitialControlLoadingFinished = useMemo(
    () => controlApi && Array.isArray(filterControls),
    [controlApi, filterControls]
  );

  const ruleFilters = useRef<Filter[]>([
    {
      query: {
        match_phrase: {
          'kibana.alert.rule.uuid': ruleId,
        },
      },
      meta: {},
    },
  ]);

  const tabs: EuiTabbedContentTab[] = [
    {
      id: RULE_DETAILS_ALERTS_TAB,
      name: i18n.translate('xpack.observability.ruleDetails.rule.alertsTabText', {
        defaultMessage: 'Alerts',
      }),
      'data-test-subj': 'ruleAlertListTab',
      content: (
        <>
          <EuiSpacer size="m" />

          <ObservabilityAlertSearchbarWithUrlSync
            appName={RULE_DETAILS_ALERTS_SEARCH_BAR_ID}
            onEsQueryChange={onEsQueryChange}
            urlStorageKey={RULE_DETAILS_SEARCH_BAR_URL_STORAGE_KEY}
            defaultFilters={ruleFilters.current}
            disableLocalStorageSync={true}
            filterControls={filterControls}
            onFilterControlsChange={setFilterControls}
            onControlApiAvailable={onControlApiAvailable}
          />
          <EuiSpacer size="s" />

          <EuiFlexGroup css={{ minHeight: 450 }} direction={'column'}>
            <EuiFlexItem>
              {esQuery && ruleTypeIds && hasInitialControlLoadingFinished && (
                <ObservabilityAlertsTable
                  id={RULE_DETAILS_PAGE_ID}
                  ruleTypeIds={ruleTypeIds}
                  consumers={observabilityAlertFeatureIds}
                  query={esQuery}
                  columns={tableColumns}
                  services={{
                    data,
                    http,
                    notifications,
                    fieldFormats,
                    application,
                    licensing,
                    cases,
                    settings,
                  }}
                />
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      ),
    },
    {
      id: RULE_DETAILS_EXECUTION_TAB,
      name: i18n.translate('xpack.observability.ruleDetails.rule.eventLogTabText', {
        defaultMessage: 'Execution history',
      }),
      'data-test-subj': 'eventLogListTab',
      content: (
        <EuiFlexGroup css={{ minHeight: 600 }} direction={'column'}>
          <EuiFlexItem>
            {rule && ruleType ? <RuleEventLogList ruleId={rule.id} ruleType={ruleType} /> : null}
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
  ];

  const handleTabIdChange = (newTabId: TabId) => {
    onSetTabId(newTabId);
  };

  return (
    <EuiTabbedContent
      data-test-subj="ruleDetailsTabbedContent"
      tabs={tabs}
      selectedTab={tabs.find((tab) => tab.id === activeTabId)}
      onTabClick={(tab) => {
        handleTabIdChange(tab.id as TabId);
      }}
    />
  );
}
