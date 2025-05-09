/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render } from '../../../../../utils/test_helper';
import { EmptySection, Section } from './empty_section';

describe('EmptySection', () => {
  it('renders without action button', () => {
    const section: Section = {
      id: 'apm',
      title: 'APM',
      icon: 'logoObservability',
      description: 'foo bar',
      showInServerless: false,
    };
    const { getByText, queryAllByText } = render(<EmptySection section={section} />);

    expect(getByText('APM')).toBeInTheDocument();
    expect(getByText('foo bar')).toBeInTheDocument();
    expect(queryAllByText('Install agent')).toEqual([]);
  });
  it('renders with action button', () => {
    const section: Section = {
      id: 'apm',
      title: 'APM',
      icon: 'logoObservability',
      description: 'foo bar',
      linkTitle: 'install agent',
      href: 'https://www.elastic.co',
      showInServerless: false,
    };
    const { getByText, getByTestId } = render(<EmptySection section={section} />);

    expect(getByText('APM')).toBeInTheDocument();
    expect(getByText('foo bar')).toBeInTheDocument();
    const linkButton = getByTestId('empty-apm') as HTMLAnchorElement;
    expect(linkButton.href).toEqual('https://www.elastic.co/');
  });
});
