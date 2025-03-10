/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';

import {
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiSpacer,
  EuiComboBox,
  EuiFieldNumber,
} from '@elastic/eui';

import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { withKibana } from '@kbn/kibana-react-plugin/public';

import { tabColor } from '../../../../../../../common/util/group_color_utils';

export class EditJobDetailsTabUI extends Component {
  constructor(props) {
    super(props);

    this.state = {
      description: '',
      groups: [],
      selectedGroups: [],
      mml: '',
      mmlValidationError: '',
      groupsValidationError: '',
      modelSnapshotRetentionDays: 1,
      dailyModelSnapshotRetentionAfterDays: 1,
    };

    this.setJobDetails = props.setJobDetails;
  }

  componentDidMount() {
    const euiTheme = this.props.euiTheme;
    const mlApi = this.props.kibana.services.mlServices.mlApi;
    // load groups to populate the select options
    mlApi.jobs
      .groups()
      .then((resp) => {
        const groups = resp.map((g) => ({ label: g.id, color: tabColor(g.id, euiTheme) }));
        this.setState({ groups });
      })
      .catch((error) => {
        console.error('Could not load groups', error);
      });
  }

  static getDerivedStateFromProps(props) {
    const selectedGroups =
      props.jobGroups !== undefined
        ? props.jobGroups.map((g) => ({ label: g, color: tabColor(g, props.euiTheme) }))
        : [];

    const { datafeedRunning, jobClosed } = props;

    let mmlHelpText = null;
    if (!jobClosed) {
      mmlHelpText = (
        <FormattedMessage
          id="xpack.ml.jobsList.editJobFlyout.jobDetails.modelMemoryLimitJobOpenLabelHelp"
          defaultMessage="Model memory limit cannot be edited while the job is open."
        />
      );
    }

    if (datafeedRunning) {
      mmlHelpText = (
        <FormattedMessage
          id="xpack.ml.jobsList.editJobFlyout.jobDetails.modelMemoryLimitLabelHelp"
          defaultMessage="Model memory limit cannot be edited while the datafeed is running."
        />
      );
    }

    return {
      description: props.jobDescription,
      selectedGroups,
      mml: props.jobModelMemoryLimit,
      mmlHelpText,
      mmlValidationError: props.jobModelMemoryLimitValidationError,
      groupsValidationError: props.jobGroupsValidationError,
      modelSnapshotRetentionDays: props.jobModelSnapshotRetentionDays,
      dailyModelSnapshotRetentionAfterDays: props.jobDailyModelSnapshotRetentionAfterDays,
    };
  }

  onDescriptionChange = (e) => {
    this.setJobDetails({ jobDescription: e.target.value });
  };

  onMmlChange = (e) => {
    this.setJobDetails({ jobModelMemoryLimit: e.target.value });
  };

  onModelSnapshotRetentionDaysChange = (e) => {
    const jobModelSnapshotRetentionDays = Math.floor(+e.target.value);

    this.setJobDetails({
      jobModelSnapshotRetentionDays,
      ...(this.state.dailyModelSnapshotRetentionAfterDays > jobModelSnapshotRetentionDays
        ? { jobDailyModelSnapshotRetentionAfterDays: jobModelSnapshotRetentionDays }
        : {}),
    });
  };

  onDailyModelSnapshotRetentionAfterDaysChange = (e) => {
    const jobDailyModelSnapshotRetentionAfterDays = Math.floor(+e.target.value);
    if (jobDailyModelSnapshotRetentionAfterDays <= this.state.modelSnapshotRetentionDays) {
      this.setJobDetails({ jobDailyModelSnapshotRetentionAfterDays });
    }
  };

  onGroupsChange = (selectedGroups) => {
    this.setJobDetails({ jobGroups: selectedGroups.map((g) => g.label) });
  };

  onCreateGroup = (input, flattenedOptions) => {
    const normalizedSearchValue = input.trim().toLowerCase();

    if (!normalizedSearchValue) {
      return;
    }

    const newGroup = {
      label: input,
    };

    const groups = this.state.groups;
    // Create the option if it doesn't exist.
    if (
      flattenedOptions.findIndex(
        (option) => option.label.trim().toLowerCase() === normalizedSearchValue
      ) === -1
    ) {
      groups.push(newGroup);
    }

    const selectedGroups = this.state.selectedGroups.concat(newGroup);

    // update the groups in local state and call onGroupsChange to
    // update the selected groups in the component above which manages this
    // component's state
    this.setState({ groups }, () => this.onGroupsChange(selectedGroups));
  };

  render() {
    const {
      description,
      selectedGroups,
      mml,
      groups,
      mmlValidationError,
      groupsValidationError,
      modelSnapshotRetentionDays,
      dailyModelSnapshotRetentionAfterDays,
      mmlHelpText,
    } = this.state;

    const { datafeedRunning, jobClosed } = this.props;

    return (
      <React.Fragment>
        <EuiSpacer size="m" />
        <EuiForm>
          <EuiFormRow
            label={
              <FormattedMessage
                id="xpack.ml.jobsList.editJobFlyout.jobDetails.jobDescriptionLabel"
                defaultMessage="Job description"
              />
            }
          >
            <EuiFieldText value={description} onChange={this.onDescriptionChange} />
          </EuiFormRow>
          <EuiFormRow
            label={
              <FormattedMessage
                id="xpack.ml.jobsList.editJobFlyout.jobDetails.jobGroupsLabel"
                defaultMessage="Job groups"
              />
            }
            isInvalid={groupsValidationError !== ''}
            error={groupsValidationError}
          >
            <EuiComboBox
              placeholder={i18n.translate(
                'xpack.ml.jobsList.editJobFlyout.jobDetails.jobGroupsPlaceholder',
                {
                  defaultMessage: 'Select or create groups',
                }
              )}
              options={groups}
              selectedOptions={selectedGroups}
              onChange={this.onGroupsChange}
              onCreateOption={this.onCreateGroup}
              isClearable={true}
              isInvalid={groupsValidationError !== ''}
              error={groupsValidationError}
            />
          </EuiFormRow>
          <EuiFormRow
            label={
              <FormattedMessage
                id="xpack.ml.jobsList.editJobFlyout.jobDetails.modelMemoryLimitLabel"
                defaultMessage="Model memory limit"
              />
            }
            helpText={mmlHelpText}
            isInvalid={mmlValidationError !== ''}
            error={mmlValidationError}
          >
            <EuiFieldText
              value={mml}
              onChange={this.onMmlChange}
              isInvalid={mmlValidationError !== ''}
              error={mmlValidationError}
              disabled={datafeedRunning || !jobClosed}
            />
          </EuiFormRow>
          <EuiFormRow
            label={
              <FormattedMessage
                id="xpack.ml.jobsList.editJobFlyout.jobDetails.modelSnapshotRetentionDaysLabel"
                defaultMessage="Model snapshot retention days"
              />
            }
          >
            <EuiFieldNumber
              min={0}
              value={modelSnapshotRetentionDays}
              onChange={this.onModelSnapshotRetentionDaysChange}
            />
          </EuiFormRow>
          <EuiFormRow
            label={
              <FormattedMessage
                id="xpack.ml.jobsList.editJobFlyout.jobDetails.dailyModelSnapshotRetentionAfterDaysLabel"
                defaultMessage="Daily model snapshot retention after days"
              />
            }
          >
            <EuiFieldNumber
              min={0}
              max={modelSnapshotRetentionDays}
              value={dailyModelSnapshotRetentionAfterDays}
              onChange={this.onDailyModelSnapshotRetentionAfterDaysChange}
            />
          </EuiFormRow>
        </EuiForm>
      </React.Fragment>
    );
  }
}
EditJobDetailsTabUI.propTypes = {
  datafeedRunning: PropTypes.bool.isRequired,
  euiTheme: PropTypes.object.isRequired,
  jobDescription: PropTypes.string.isRequired,
  jobGroups: PropTypes.array.isRequired,
  jobModelMemoryLimit: PropTypes.string.isRequired,
  setJobDetails: PropTypes.func.isRequired,
};

export const EditJobDetailsTab = withKibana(EditJobDetailsTabUI);
