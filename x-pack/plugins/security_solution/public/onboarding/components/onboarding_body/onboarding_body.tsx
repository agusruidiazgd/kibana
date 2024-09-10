/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { Suspense, useCallback, useEffect } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner, EuiSpacer, useEuiTheme } from '@elastic/eui';
import { KibanaPageTemplate } from '@kbn/shared-ux-page-kibana-template';
import { css } from '@emotion/react';
import { PAGE_CONTENT_WIDTH, type OnboardingHubCardId } from '../../constants';
import { useCardGroupsConfig } from './use_card_groups_config';
import { useOnboardingContext } from '../onboarding_context';
import { OnboardingCardGroup } from './onboarding_card_group';
import { OnboardingCardPanel } from './onboarding_card_panel';
import { useCheckCompleteCards } from './use_check_complete_cards';
import { useExpandedCard } from './use_expanded_card';
import { useCompletedCards } from './use_completed_cards';

export const OnboardingBody = React.memo(() => {
  const { euiTheme } = useEuiTheme();
  const { spaceId } = useOnboardingContext();
  const cardGroupsConfig = useCardGroupsConfig();

  const { expandedCardId, setExpandedCardId } = useExpandedCard(spaceId);
  const { isCardComplete, setCardComplete } = useCompletedCards(spaceId);

  const { checkAllCardsComplete, checkCardComplete } = useCheckCompleteCards(
    cardGroupsConfig,
    setCardComplete
  );

  useEffect(() => {
    // initial auto-check for all cards
    checkAllCardsComplete();
  }, [checkAllCardsComplete]);

  const createOnToggleExpanded = useCallback(
    (cardId: OnboardingHubCardId) => () => {
      if (expandedCardId === cardId) {
        setExpandedCardId(null);
      } else {
        setExpandedCardId(cardId);
        // execute the auto-check for the card when it's been expanded
        checkCardComplete(cardId);
      }
    },
    [setExpandedCardId, expandedCardId, checkCardComplete]
  );

  const createSetCardComplete = useCallback(
    (cardId: OnboardingHubCardId) => (complete: boolean) => {
      setCardComplete(cardId, complete);
    },
    [setCardComplete]
  );

  return (
    <KibanaPageTemplate.Section
      bottomBorder="extended"
      grow={true}
      restrictWidth={PAGE_CONTENT_WIDTH}
      paddingSize="xl"
      css={css`
        background-color: ${euiTheme.colors.lightestShade};
      `}
    >
      <EuiFlexGroup direction="column" gutterSize="xl">
        {cardGroupsConfig.map((group, index) => (
          <EuiFlexItem key={index} grow={false}>
            <OnboardingCardGroup title={group.title}>
              <EuiFlexGroup direction="column" gutterSize="m">
                {group.cards.map(({ id, title, icon, Component: LazyCardComponent }) => (
                  <EuiFlexItem key={id} grow={false}>
                    <OnboardingCardPanel
                      id={id}
                      title={title}
                      icon={icon}
                      isExpanded={expandedCardId === id}
                      isComplete={isCardComplete(id)}
                      onToggleExpanded={createOnToggleExpanded(id)}
                    >
                      <Suspense fallback={<EuiLoadingSpinner size="m" />}>
                        <LazyCardComponent setComplete={createSetCardComplete(id)} />
                      </Suspense>
                    </OnboardingCardPanel>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </OnboardingCardGroup>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      <EuiSpacer size="l" />
    </KibanaPageTemplate.Section>
  );
});

OnboardingBody.displayName = 'OnboardingBody';
