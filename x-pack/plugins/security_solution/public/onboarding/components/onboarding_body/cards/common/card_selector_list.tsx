/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useEffect } from 'react';
import { EuiPanel, EuiFlexGroup, EuiFlexItem, EuiTitle, EuiText, EuiSpacer } from '@elastic/eui';
import type { RulesCardItemId } from '../rules/types';
import type { AlertsCardItemId } from '../alerts/types';
import type { DashboardsCardItemId } from '../dashboards/types';
import { useCardSelectorListStyles } from './card_selector_list.styles';

const INITIAL_SCROLL_ANIMATION_DURATION = 500;
const SCROLL_ANIMATION_DURATION = 300;

export enum CardSelectorListItemAssetType {
  video = 'video',
  image = 'image',
}
export interface CardSelectorListItem {
  id: RulesCardItemId | AlertsCardItemId | DashboardsCardItemId;
  title: string;
  description: string;
  asset: {
    type: CardSelectorListItemAssetType;
    source: string;
    alt: string;
  };
}

interface CardSelectorListProps {
  items: CardSelectorListItem[];
  onSelect: (item: CardSelectorListItem) => void;
  selectedItem: CardSelectorListItem;
  title?: string;
}

const scrollToSelectedItem = (
  cardId: string,
  animationDuration: number = SCROLL_ANIMATION_DURATION
) => {
  setTimeout(() => {
    const element = document.getElementById(`${cardId}-selector`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, animationDuration);
};

export const CardSelectorList = React.memo<CardSelectorListProps>(
  ({ items, onSelect, selectedItem, title }) => {
    const styles = useCardSelectorListStyles();

    useEffect(() => {
      scrollToSelectedItem(selectedItem.id, INITIAL_SCROLL_ANIMATION_DURATION);
    }, [selectedItem]);

    return (
      <EuiFlexGroup direction="column" gutterSize="s" className={styles}>
        {title && (
          <EuiFlexItem>
            <EuiText data-test-subj="rulesCardDescription" size="xs" className="cardSelectorTitle">
              {title}
            </EuiText>
          </EuiFlexItem>
        )}
        <EuiFlexItem>
          <EuiFlexGroup
            id="scroll-container"
            className="cardSelectorContent"
            direction="column"
            gutterSize="s"
          >
            {items.map((item) => (
              <EuiFlexItem id={`${item.id}-selector`} grow={false}>
                <EuiPanel
                  hasBorder
                  className={selectedItem.id === item.id ? 'selectedCardPanelItem' : ''}
                  color={selectedItem.id === item.id ? 'subdued' : 'plain'}
                  element="button"
                  onClick={() => {
                    onSelect(item);
                  }}
                >
                  <EuiTitle data-test-subj="rulesCardDescription" size="xxs">
                    <h5>{item.title}</h5>
                  </EuiTitle>
                  <EuiSpacer size="xs" />
                  <EuiText data-test-subj="rulesCardDescription" size="xs">
                    {item.description}
                  </EuiText>
                </EuiPanel>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
);
CardSelectorList.displayName = 'CardSelectorList';
