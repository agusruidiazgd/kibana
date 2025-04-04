/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { waitFor, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { connector, resilientIncidentTypes, resilientSeverity } from '../mock';
import { useGetIncidentTypes } from './use_get_incident_types';
import { useGetSeverity } from './use_get_severity';
import Fields from './case_fields';

import { renderWithTestingProviders } from '../../../common/mock';
import { MockFormWrapperComponent } from '../test_utils';

jest.mock('../../../common/lib/kibana');
jest.mock('./use_get_incident_types');
jest.mock('./use_get_severity');

const useGetIncidentTypesMock = useGetIncidentTypes as jest.Mock;
const useGetSeverityMock = useGetSeverity as jest.Mock;

describe('ResilientParamsFields renders', () => {
  const useGetIncidentTypesResponse = {
    isLoading: false,
    isFetching: false,
    data: {
      data: resilientIncidentTypes,
    },
  };

  const useGetSeverityResponse = {
    isLoading: false,
    isFetching: false,
    data: {
      data: resilientSeverity,
    },
  };

  const fields = {
    severityCode: '6',
    incidentTypes: ['19'],
  };

  let user: UserEvent;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    // Workaround for timeout via https://github.com/testing-library/user-event/issues/833#issuecomment-1171452841
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    useGetIncidentTypesMock.mockReturnValue(useGetIncidentTypesResponse);
    useGetSeverityMock.mockReturnValue(useGetSeverityResponse);
    jest.clearAllMocks();
  });

  it('all params fields are rendered', () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    expect(screen.getByText('Malware')).toBeInTheDocument();
    expect(screen.getByTestId('severitySelect')).toHaveValue('6');
  });

  it('disabled the fields when loading incident types', async () => {
    useGetIncidentTypesMock.mockReturnValue({ ...useGetIncidentTypesResponse, isLoading: true });

    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    expect(within(screen.getByTestId('incidentTypeComboBox')).getByRole('combobox')).toBeDisabled();
  });

  it('disabled the fields when loading severity', () => {
    useGetSeverityMock.mockReturnValue({
      ...useGetSeverityResponse,
      isLoading: true,
    });

    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    expect(screen.getByTestId('severitySelect')).toBeDisabled();
  });

  it('sets issue type correctly', async () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    const checkbox = within(screen.getByTestId('incidentTypeComboBox')).getByTestId(
      'comboBoxSearchInput'
    );

    await user.type(checkbox, 'Denial of Service{enter}');

    expect(screen.getByText('Denial of Service')).toBeInTheDocument();
  });

  it('sets severity correctly', async () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    await user.selectOptions(screen.getByTestId('severitySelect'), 'Low');
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('should submit a resilient connector', async () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    await waitFor(() => {
      expect(screen.getByTestId('incidentTypeComboBox')).toBeInTheDocument();
    });

    expect(screen.getByRole('option', { name: 'Low' }));

    const checkbox = within(screen.getByTestId('incidentTypeComboBox')).getByTestId(
      'comboBoxSearchInput'
    );

    await user.type(checkbox, 'Denial of Service{enter}');

    await user.selectOptions(screen.getByTestId('severitySelect'), ['4']);

    expect(screen.getByText('Denial of Service')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });
});
