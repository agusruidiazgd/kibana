/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useState } from 'react';
import { type ActionConnector } from '@kbn/triggers-actions-ui-plugin/public/common/constants';
import {
  useEuiTheme,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiLoadingSpinner,
  EuiLink,
  EuiButton,
} from '@elastic/eui';
import { css } from '@emotion/css';
import type { ActionType } from '@kbn/actions-plugin/common';
import { AddConnectorModal } from '@kbn/elastic-assistant/impl/connectorland/add_connector_modal';
import { useKibana } from '../../../../../../common/lib/kibana';
import { useFilteredActionTypes } from './hooks/use_load_action_types';

const usePanelCss = () => {
  const { euiTheme } = useEuiTheme();
  return css`
    .connectorSelectorPanel {
      height: 160px;
      &.euiPanel:hover {
        background-color: ${euiTheme.colors.lightestShade};
      }
    }
  `;
};

interface ConnectorSetupProps {
  onConnectorSaved?: (savedAction: ActionConnector) => void;
  onClose?: () => void;
  compressed?: boolean;
}
export const ConnectorSetup = React.memo<ConnectorSetupProps>(
  ({ onConnectorSaved, onClose, compressed = false }) => {
    const [addFlyoutVisible, setAddFlyoutVisibility] = useState<boolean>(false);
    const [isLoadingActions, setIsLoadingActions] = useState<boolean>(true);
    const [actions, setActions] = useState<ActionConnector[]>([]);
    const panelCss = usePanelCss();
    const {
      http,
      triggersActionsUi: { actionTypeRegistry },
      notifications: { toasts },
    } = useKibana().services;
    const [selectedActionType, setSelectedActionType] = useState<ActionType | null>(null);

    const onModalClose = useCallback(() => {
      setSelectedActionType(null);
      setAddFlyoutVisibility(false);
      onClose?.();
    }, [onClose]);

    const { actionTypes } = useFilteredActionTypes(http, toasts);

    if (!actionTypes) {
      return <EuiLoadingSpinner />;
    }

    return (
      <>
        <EuiPanel hasShadow={false} hasBorder>
          <EuiFlexGroup
            style={{ height: '100%' }}
            direction="column"
            justifyContent="center"
            alignItems="center"
            gutterSize="m"
          >
            <EuiFlexItem grow={false}>
              <EuiFlexGroup direction="row" justifyContent="center">
                {actionTypes.map((actionType: ActionType) => (
                  <EuiFlexItem grow={false} key={actionType.id}>
                    <EuiLink
                      color="text"
                      onClick={() => setSelectedActionType(actionType)}
                      data-test-subj={`actionType-${actionType.id}`}
                      className={panelCss}
                    >
                      <EuiFlexGroup
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                        gutterSize="s"
                        className={css`
                          height: 100%;
                        `}
                      >
                        <EuiFlexItem grow={false}>
                          <EuiIcon
                            size="xxl"
                            color="text"
                            type={actionTypeRegistry.get(actionType.id).iconClass}
                          />
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiLink>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                data-test-subj="createConnectorButton"
                iconType="plusInCircle"
                iconSide="left"
                onClick={() => setAddFlyoutVisibility(true)}
                isLoading={false}
              >
                {'AI service provider'}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
        {addFlyoutVisible && onConnectorSaved && (
          <AddConnectorModal
            actionTypeRegistry={actionTypeRegistry}
            actionTypes={actionTypes}
            onClose={onModalClose}
            onSaveConnector={onConnectorSaved}
            onSelectActionType={setSelectedActionType}
            selectedActionType={selectedActionType}
          />
        )}
      </>
    );
  }
);
ConnectorSetup.displayName = 'ConnectorSetup';
