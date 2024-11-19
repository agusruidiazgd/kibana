/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiLink, EuiSpacer, EuiText } from '@elastic/eui';
import { SecurityPageName } from '@kbn/security-solution-navigation';
import { LocalStorageKey, useStoredSelectedCardItemId } from '../../../../hooks/use_stored_state';
import { SecuritySolutionLinkButton } from '../../../../../common/components/links';
import { OnboardingCardId } from '../../../../constants';
import type { OnboardingCardComponent } from '../../../../types';
import { OnboardingCardContentAssetPanel } from '../common/card_content_asset_panel';
import { CardCallOut } from '../common/card_callout';

import * as i18n from './translations';
import type { CardSelectorListItem } from '../common/card_selector_list';
import { CardSelectorList } from '../common/card_selector_list';
import { useOnboardingContext } from '../../../onboarding_context';
import { RULES_CARD_ITEMS, RULES_CARD_ITEMS_BY_ID } from './rules_card_config';
import { useDelayedVisibility } from '../../hooks/use_delayed_visibility';
import { DEFAULT_RULES_CARD_ITEM_SELECTED } from './constants';

export const RulesCard: OnboardingCardComponent = ({
  isCardComplete,
  setExpandedCardId,
  isExpanded,
}) => {
  const { spaceId } = useOnboardingContext();
  const isCardContentVisible = useDelayedVisibility({ isExpanded });

  const [toggleIdSelected, setStoredSelectedRulesCardItemId] = useStoredSelectedCardItemId(
    LocalStorageKey.selectedRulesCardItemId,
    spaceId,
    DEFAULT_RULES_CARD_ITEM_SELECTED.id
  );
  const [selectedCardItem, setSelectedCardItem] = useState(
    RULES_CARD_ITEMS_BY_ID[toggleIdSelected]
  );
  const isIntegrationsCardComplete = useMemo(
    () => isCardComplete(OnboardingCardId.integrations),
    [isCardComplete]
  );

  const expandIntegrationsCard = useCallback(() => {
    setExpandedCardId(OnboardingCardId.integrations, { scroll: true });
  }, [setExpandedCardId]);

  const onSelectCard = useCallback(
    (item: CardSelectorListItem) => {
      setSelectedCardItem(item);
      setStoredSelectedRulesCardItemId(item.id);
    },
    [setStoredSelectedRulesCardItemId]
  );

  if (!isCardContentVisible) return null;

  return (
    <OnboardingCardContentAssetPanel asset={selectedCardItem.asset}>
      <EuiFlexGroup
        direction="column"
        gutterSize="xl"
        justifyContent="flexStart"
        alignItems="flexStart"
      >
        <EuiFlexItem grow={false}>
          <EuiText data-test-subj="rulesCardDescription" size="s">
            {i18n.RULES_CARD_DESCRIPTION}
          </EuiText>
          <EuiSpacer />
          <CardSelectorList
            title={i18n.RULES_CARD_STEP_SELECTOR_TITLE}
            items={RULES_CARD_ITEMS}
            onSelect={onSelectCard}
            selectedItem={selectedCardItem}
          />
          {!isIntegrationsCardComplete && (
            <>
              <EuiSpacer size="m" />
              <CardCallOut
                color="primary"
                icon="iInCircle"
                text={i18n.RULES_CARD_CALLOUT_INTEGRATIONS_TEXT}
                action={
                  <EuiLink onClick={expandIntegrationsCard}>
                    <EuiFlexGroup direction="row" gutterSize="xs" alignItems="center">
                      <EuiFlexItem>{i18n.RULES_CARD_CALLOUT_INTEGRATIONS_BUTTON}</EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiIcon type="arrowRight" color="primary" size="s" />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiLink>
                }
              />
            </>
          )}
        </EuiFlexItem>
        <EuiFlexItem data-test-subj="rulesCardButton" grow={false}>
          <SecuritySolutionLinkButton
            deepLinkId={SecurityPageName.rules}
            fill
            isDisabled={!isIntegrationsCardComplete}
          >
            {i18n.RULES_CARD_ADD_RULES_BUTTON}
          </SecuritySolutionLinkButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </OnboardingCardContentAssetPanel>
  );
};

// eslint-disable-next-line import/no-default-export
export default RulesCard;
