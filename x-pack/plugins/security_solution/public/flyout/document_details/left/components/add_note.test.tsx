/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as uuid from 'uuid';
import { render } from '@testing-library/react';
import React from 'react';
import { createMockStore, mockGlobalState, TestProviders } from '../../../../common/mock';
import { AddNote, CREATE_NOTE_ERROR } from './add_note';
import {
  ADD_NOTE_BUTTON_TEST_ID,
  ADD_NOTE_MARKDOWN_TEST_ID,
  ATTACH_TO_TIMELINE_CHECKBOX_TEST_ID,
} from './test_ids';
import { ReqStatus } from '../../../../notes/store/notes.slice';
import { TimelineId } from '../../../../../common/types';
import userEvent from '@testing-library/user-event';
import { useWhichFlyout } from '../../shared/hooks/use_which_flyout';
import { Flyouts } from '../../shared/constants/flyouts';

jest.mock('../../shared/hooks/use_which_flyout');

const mockAddError = jest.fn();
jest.mock('../../../../common/hooks/use_app_toasts', () => ({
  useAppToasts: () => ({
    addError: mockAddError,
  }),
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => {
  const original = jest.requireActual('react-redux');
  return {
    ...original,
    useDispatch: () => mockDispatch,
  };
});

const renderAddNote = () =>
  render(
    <TestProviders>
      <AddNote eventId={'event-id'} />
    </TestProviders>
  );

describe('AddNote', () => {
  it('should render the markdown and add button components', () => {
    const { getByTestId } = renderAddNote();

    expect(getByTestId(ADD_NOTE_MARKDOWN_TEST_ID)).toBeInTheDocument();
    expect(getByTestId(ADD_NOTE_BUTTON_TEST_ID)).toBeInTheDocument();
    expect(getByTestId(ATTACH_TO_TIMELINE_CHECKBOX_TEST_ID)).toBeInTheDocument();
  });

  it('should create note', async () => {
    const { getByTestId } = renderAddNote();

    await userEvent.type(getByTestId('euiMarkdownEditorTextArea'), 'new note');
    getByTestId(ADD_NOTE_BUTTON_TEST_ID).click();

    expect(mockDispatch).toHaveBeenCalled();
  });

  it('should disable add button markdown editor if invalid', async () => {
    const { getByTestId } = renderAddNote();

    const addButton = getByTestId(ADD_NOTE_BUTTON_TEST_ID);

    expect(addButton).toHaveAttribute('disabled');

    await userEvent.type(getByTestId('euiMarkdownEditorTextArea'), 'new note');

    expect(addButton).not.toHaveAttribute('disabled');
  });

  it('should render the add note button in loading state while creating a new note', () => {
    const store = createMockStore({
      ...mockGlobalState,
      notes: {
        ...mockGlobalState.notes,
        status: {
          ...mockGlobalState.notes.status,
          createNote: ReqStatus.Loading,
        },
      },
    });

    const { container } = render(
      <TestProviders store={store}>
        <AddNote eventId={'event-id'} />
      </TestProviders>
    );

    expect(container.querySelector('.euiLoadingSpinner')).toBeInTheDocument();
  });

  it('should render error toast if create a note fails', () => {
    const store = createMockStore({
      ...mockGlobalState,
      notes: {
        ...mockGlobalState.notes,
        status: {
          ...mockGlobalState.notes.status,
          createNote: ReqStatus.Failed,
        },
        error: {
          ...mockGlobalState.notes.error,
          createNote: { type: 'http', status: 500 },
        },
      },
    });

    render(
      <TestProviders store={store}>
        <AddNote eventId={'event-id'} />
      </TestProviders>
    );

    expect(mockAddError).toHaveBeenCalledWith(null, {
      title: CREATE_NOTE_ERROR,
    });
  });

  it('should disable attach to timeline checkbox if flyout is not open from timeline', () => {
    (useWhichFlyout as jest.Mock).mockReturnValue(Flyouts.securitySolution);

    const { getByTestId } = renderAddNote();

    expect(getByTestId(ATTACH_TO_TIMELINE_CHECKBOX_TEST_ID)).toHaveAttribute('disabled');
  });

  it('should disable attach to timeline checkbox if active timeline is not saved', () => {
    (useWhichFlyout as jest.Mock).mockReturnValue(Flyouts.timeline);

    const store = createMockStore({
      ...mockGlobalState,
      timeline: {
        ...mockGlobalState.timeline,
        timelineById: {
          ...mockGlobalState.timeline.timelineById,
          [TimelineId.active]: {
            ...mockGlobalState.timeline.timelineById[TimelineId.test],
          },
        },
      },
    });

    const { getByTestId } = render(
      <TestProviders store={store}>
        <AddNote eventId={'event-id'} />
      </TestProviders>
    );

    expect(getByTestId(ATTACH_TO_TIMELINE_CHECKBOX_TEST_ID)).toHaveAttribute('disabled');
  });

  it('should have attach to timeline checkbox enabled', () => {
    (useWhichFlyout as jest.Mock).mockReturnValue(Flyouts.timeline);

    const store = createMockStore({
      ...mockGlobalState,
      timeline: {
        ...mockGlobalState.timeline,
        timelineById: {
          ...mockGlobalState.timeline.timelineById,
          [TimelineId.active]: {
            ...mockGlobalState.timeline.timelineById[TimelineId.test],
            savedObjectId: uuid.v4(),
          },
        },
      },
    });

    const { getByTestId } = render(
      <TestProviders store={store}>
        <AddNote eventId={'event-id'} />
      </TestProviders>
    );

    expect(getByTestId(ATTACH_TO_TIMELINE_CHECKBOX_TEST_ID)).not.toHaveAttribute('disabled');
  });
});
