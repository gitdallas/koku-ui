import './optimizations.scss';

import {
  Bullseye,
  Spinner,
  TextContent,
  TextList,
  TextListItem,
  TextListItemVariants,
  TextListVariants,
} from '@patternfly/react-core';
import { Table /* data-codemods */, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import type { RecommendationItem, RecommendationReportData } from 'api/ros/recommendations';
import { RosPathsType, RosType } from 'api/ros/ros';
import type { AxiosError } from 'axios';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { EmptyValueState } from 'routes/components/state/emptyValueState';
import { createMapStateToProps, FetchStatus } from 'store/common';
import { rosActions, rosSelectors } from 'store/ros';
import { getTimeFromNow } from 'utils/dates';
import type { RouterComponentProps } from 'utils/router';
import { withRouter } from 'utils/router';

import { styles } from './optimizations.styles';
import { OptimizationsLink } from './optimizationsLink';
import { OptimizationsToolbar } from './optimizationsToolbar';

interface OptimizationsContentOwnProps extends RouterComponentProps {
  id?: string;
  onClose();
  project?: string;
}

interface OptimizationsContentStateProps {
  report?: RecommendationReportData;
  reportError?: AxiosError;
  reportFetchStatus?: FetchStatus;
  reportQueryString?: string;
}

interface OptimizationsContentDispatchProps {
  fetchRosReport: typeof rosActions.fetchRosReport;
}

interface OptimizationsContentState {
  currentInterval: string;
}

type OptimizationsContentProps = OptimizationsContentOwnProps &
  OptimizationsContentStateProps &
  OptimizationsContentDispatchProps &
  WrappedComponentProps;

// eslint-disable-next-line no-shadow
export const enum Interval {
  short_term = 'short_term', // last 24 hrs
  medium_term = 'medium_term', // last 7 days
  long_term = 'long_term', // last 15 days
}

const reportType = RosType.ros as any;
const reportPathsType = RosPathsType.recommendation as any;

class OptimizationsContentBase extends React.Component<OptimizationsContentProps, any> {
  protected defaultState: OptimizationsContentState = {
    currentInterval: Interval.short_term,
  };
  public state: OptimizationsContentState = { ...this.defaultState };

  public componentDidMount() {
    this.updateReport();
    this.setState({ currentInterval: this.getDefaultTerm() });
  }

  public componentDidUpdate(prevProps: OptimizationsContentProps) {
    if (prevProps.id !== this.props.id) {
      this.updateReport();
    }
  }

  private updateReport() {
    const { fetchRosReport, reportQueryString } = this.props;
    fetchRosReport(reportPathsType, reportType, reportQueryString);
  }

  private getDefaultTerm = () => {
    const { report } = this.props;

    let result = Interval.short_term;
    if (!(report && report.recommendations && report.recommendations.duration_based)) {
      return result;
    }

    const recommendation = report.recommendations.duration_based;
    if (this.hasRecommendation(recommendation.short_term)) {
      result = Interval.short_term;
    } else if (this.hasRecommendation(recommendation.medium_term)) {
      result = Interval.medium_term;
    } else if (this.hasRecommendation(recommendation.long_term)) {
      result = Interval.long_term;
    }
    return result;
  };

  private hasRecommendation = term => {
    if (!term) {
      return false;
    }

    const hasConfigLimitsCpu = this.hasValues(term, 'config', 'limits', 'cpu');
    const hasConfigLimitsMemory = this.hasValues(term, 'config', 'limits', 'memory');
    const hasConfigRequestsCpu = this.hasValues(term, 'config', 'requests', 'cpu');
    const hasConfigRequestsMemory = this.hasValues(term, 'config', 'requests', 'memory');

    return hasConfigLimitsCpu || hasConfigLimitsMemory || hasConfigRequestsCpu || hasConfigRequestsMemory;
  };

  // Helper to determine if config and variation are empty objects
  // Example: key1 = config, key2 = limits, key3 = cpu
  private hasValues = (term, key1: string, key2: string, key3: string) => {
    let result = false;
    if (term && term[key1] && term[key1][key2] && term[key1][key2][key3]) {
      result = Object.keys(term[key1][key2][key3]).length > 0;
    }
    return result;
  };

  private getDescription = () => {
    const { intl, report } = this.props;

    const clusterAlias = report && report.cluster_alias ? report.cluster_alias : undefined;
    const clusterUuid = report && report.cluster_uuid ? report.cluster_uuid : '';
    const cluster = clusterAlias ? clusterAlias : clusterUuid;

    const lastReported = report ? getTimeFromNow(report.last_reported) : '';
    const project = report && report.project ? report.project : '';
    const workload = report && report.workload ? report.workload : '';
    const workloadType = report && report.workload_type ? report.workload_type : '';

    return (
      <TextContent>
        <TextList component={TextListVariants.dl}>
          <TextListItem component={TextListItemVariants.dt}>
            {intl.formatMessage(messages.optimizationsValues, { value: 'last_reported' })}
          </TextListItem>
          <TextListItem component={TextListItemVariants.dd}>{lastReported}</TextListItem>
          <TextListItem component={TextListItemVariants.dt}>
            {intl.formatMessage(messages.optimizationsValues, { value: 'cluster' })}
          </TextListItem>
          <TextListItem component={TextListItemVariants.dd}>{cluster}</TextListItem>
          <TextListItem component={TextListItemVariants.dt}>
            {intl.formatMessage(messages.optimizationsValues, { value: 'project' })}
          </TextListItem>
          <TextListItem component={TextListItemVariants.dd}>{project}</TextListItem>
          <TextListItem component={TextListItemVariants.dt}>
            {intl.formatMessage(messages.optimizationsValues, { value: 'workload_type' })}
          </TextListItem>
          <TextListItem component={TextListItemVariants.dd}>{workloadType}</TextListItem>
          <TextListItem component={TextListItemVariants.dt}>
            {intl.formatMessage(messages.optimizationsValues, { value: 'workload' })}
          </TextListItem>
          <TextListItem component={TextListItemVariants.dd}>{workload}</TextListItem>
        </TextList>
      </TextContent>
    );
  };

  private getChangeValue = value => {
    // Show icon opposite of month over month
    let iconOverride = 'iconOverride';
    if (value !== null && value < 0) {
      iconOverride += ' decrease';
    } else if (value !== null && value > 0) {
      iconOverride += ' increase';
    }
    return (
      <div className="optimizationsOverride">
        <div className={iconOverride}>
          {value < 0 ? (
            <>
              <span style={styles.value}>{value}</span>
              <span className="fa fa-sort-down" />
            </>
          ) : value > 0 ? (
            <>
              <span style={styles.value}>{value}</span>
              <span className="fa fa-sort-up" />
            </>
          ) : value === 0 ? (
            <>
              <span style={styles.value}>{value}</span>
              <span className="fa fa-equals" />
            </>
          ) : (
            <EmptyValueState />
          )}
        </div>
      </div>
    );
  };

  private getLimitsTable = () => {
    const { intl, report } = this.props;

    if (!report) {
      return null;
    }
    const term = this.getRecommendationTerm();
    const hasConfigLimitsCpu = this.hasValues(term, 'config', 'limits', 'cpu');
    const hasConfigLimitsMemory = this.hasValues(term, 'config', 'limits', 'memory');
    const hasVariationLimitsCpu = this.hasValues(term, 'variation', 'limits', 'cpu');
    const hasVariationLimitsMemory = this.hasValues(term, 'variation', 'limits', 'memory');

    const cpuConfigAmount = hasConfigLimitsCpu ? term.config.limits.cpu.amount : undefined;
    const cpuConfigUnits = hasConfigLimitsCpu ? term.config.limits.cpu.format : undefined;
    const cpuVariation = hasVariationLimitsCpu ? term.variation.limits.cpu.amount : undefined;
    const memConfigAmount = hasConfigLimitsMemory ? term.config.limits.memory.amount : undefined;
    const memConfigUnits = hasConfigLimitsMemory ? term.config.limits.memory.format : undefined;
    const memVariation = hasVariationLimitsMemory ? term.variation.limits.memory.amount : undefined;

    return (
      <Table
        aria-label={intl.formatMessage(messages.optimizationsTableAriaLabel)}
        borders={false}
        hasSelectableRowCaption
        variant={TableVariant.compact}
      >
        <Thead>
          <Tr>
            <Th>{intl.formatMessage(messages.limits)}</Th>
            <Th>{intl.formatMessage(messages.current)}</Th>
            <Th>{intl.formatMessage(messages.recommended)}</Th>
            <Th>{intl.formatMessage(messages.change)}</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td style={styles.firstColumn}>{intl.formatMessage(messages.cpuUnits, { units: cpuConfigUnits })}</Td>
            <Td>{this.getOriginalValue(cpuConfigAmount, cpuVariation)}</Td>
            <Td hasRightBorder>{this.getFormattedValue(cpuConfigAmount)}</Td>
            <Td>{this.getChangeValue(cpuVariation)}</Td>
          </Tr>
          <Tr>
            <Td style={styles.firstColumn}>{intl.formatMessage(messages.memoryUnits, { units: memConfigUnits })}</Td>
            <Td>{this.getOriginalValue(memConfigAmount, memVariation)}</Td>
            <Td hasRightBorder>{this.getFormattedValue(memConfigAmount)}</Td>
            <Td>{this.getChangeValue(memVariation)}</Td>
          </Tr>
        </Tbody>
      </Table>
    );
  };

  private getFormattedValue = value => {
    return value ? value.toFixed(1) : <EmptyValueState />;
  };

  private getOriginalValue = (amount, variation) => {
    return amount && variation ? (amount - variation).toFixed(1) : <EmptyValueState />;
  };

  private getRecommendationTerm = (): RecommendationItem => {
    const { report } = this.props;
    const { currentInterval } = this.state;

    if (!report) {
      return undefined;
    }

    let result;
    switch (currentInterval) {
      case Interval.short_term:
        result = report.recommendations.duration_based.short_term;
        break;
      case Interval.medium_term:
        result = report.recommendations.duration_based.medium_term;
        break;
      case Interval.long_term:
        result = report.recommendations.duration_based.long_term;
        break;
    }
    return result;
  };

  private getRequestsTable = () => {
    const { intl, report } = this.props;

    if (!report) {
      return null;
    }
    const term = this.getRecommendationTerm();
    const hasConfigRequestsCpu = this.hasValues(term, 'config', 'requests', 'cpu');
    const hasConfigRequestsMemory = this.hasValues(term, 'config', 'requests', 'memory');
    const hasVariationRequestsCpu = this.hasValues(term, 'variation', 'requests', 'cpu');
    const hasVariationRequestsMemory = this.hasValues(term, 'variation', 'requests', 'memory');

    const cpuConfigAmount = hasConfigRequestsCpu ? term.config.requests.cpu.amount : undefined;
    const cpuConfigUnits = hasConfigRequestsCpu ? term.config.requests.cpu.format : undefined;
    const cpuVariation = hasVariationRequestsCpu ? term.variation.requests.cpu.amount : undefined;
    const memConfigAmount = hasConfigRequestsMemory ? term.config.requests.memory.amount : undefined;
    const memConfigUnits = hasConfigRequestsMemory ? term.config.requests.memory.format : undefined;
    const memVariation = hasVariationRequestsMemory ? term.variation.requests.memory.amount : undefined;

    return (
      <Table
        aria-label={intl.formatMessage(messages.optimizationsTableAriaLabel)}
        borders={false}
        hasSelectableRowCaption
        variant={TableVariant.compact}
      >
        <Thead>
          <Tr>
            <Th>{intl.formatMessage(messages.requests)}</Th>
            <Th>{intl.formatMessage(messages.current)}</Th>
            <Th>{intl.formatMessage(messages.recommended)}</Th>
            <Th>{intl.formatMessage(messages.change)}</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td style={styles.firstColumn}>{intl.formatMessage(messages.cpuUnits, { units: cpuConfigUnits })}</Td>
            <Td>{this.getOriginalValue(cpuConfigAmount, cpuVariation)}</Td>
            <Td hasRightBorder>{this.getFormattedValue(cpuConfigAmount)}</Td>
            <Td>{this.getChangeValue(cpuVariation)}</Td>
          </Tr>
          <Tr>
            <Td style={styles.firstColumn}>{intl.formatMessage(messages.memoryUnits, { units: memConfigUnits })}</Td>
            <Td>{this.getOriginalValue(memConfigAmount, memVariation)}</Td>
            <Td hasRightBorder>{this.getFormattedValue(memConfigAmount)}</Td>
            <Td>{this.getChangeValue(memVariation)}</Td>
          </Tr>
        </Tbody>
      </Table>
    );
  };

  private handleOnSelected = (value: string) => {
    this.setState({ currentInterval: value });
  };

  public render() {
    const { id, project, report, reportFetchStatus } = this.props;
    const { currentInterval } = this.state;

    const isLoading = reportFetchStatus === FetchStatus.inProgress;

    return (
      <div style={styles.content}>
        <div>{this.getDescription()}</div>
        <div style={styles.toolbarContainer}>
          <OptimizationsToolbar
            currentInterval={currentInterval}
            isDisabled={isLoading}
            recommendations={report ? report.recommendations.duration_based : undefined}
            onSelected={this.handleOnSelected}
          />
        </div>
        {isLoading ? (
          <Bullseye style={styles.bullseye}>
            <Spinner size="lg" />
          </Bullseye>
        ) : (
          <>
            <div style={styles.tableContainer}>{this.getRequestsTable()}</div>
            <div style={styles.tableContainer}>{this.getLimitsTable()}</div>
            <div style={styles.viewAllContainer}>
              <OptimizationsLink id={id} project={project} />
            </div>
          </>
        )}
      </div>
    );
  }
}

const mapStateToProps = createMapStateToProps<OptimizationsContentOwnProps, OptimizationsContentStateProps>(
  (state, { id }) => {
    const reportQueryString = id ? id : '';
    const report: any = rosSelectors.selectRos(state, reportPathsType, reportType, reportQueryString);
    const reportError = rosSelectors.selectRosError(state, reportPathsType, reportType, reportQueryString);
    const reportFetchStatus = rosSelectors.selectRosFetchStatus(state, reportPathsType, reportType, reportQueryString);

    return {
      report,
      reportError,
      reportFetchStatus,
      reportQueryString,
    };
  }
);

const mapDispatchToProps: OptimizationsContentDispatchProps = {
  fetchRosReport: rosActions.fetchRosReport,
};

const OptimizationsContent = injectIntl(
  withRouter(connect(mapStateToProps, mapDispatchToProps)(OptimizationsContentBase))
);

export { OptimizationsContent };
