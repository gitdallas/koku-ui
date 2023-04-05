import { Pagination, PaginationVariant } from '@patternfly/react-core';
import type { RosQuery } from 'api/queries/rosQuery';
import { getQuery, parseQuery } from 'api/queries/rosQuery';
import type { RosReport } from 'api/ros/ros';
import { RosPathsType, RosType } from 'api/ros/ros';
import type { AxiosError } from 'axios';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Loading } from 'routes/state/loading';
import { NotAvailable } from 'routes/state/notAvailable';
import { getGroupById, getGroupByValue } from 'routes/views/utils/groupBy';
import {
  handleFilterAdded,
  handleFilterRemoved,
  handlePerPageSelect,
  handleSetPage,
  handleSort,
} from 'routes/views/utils/handles';
import { createMapStateToProps, FetchStatus } from 'store/common';
import { rosActions, rosSelectors } from 'store/ros';
import type { RouterComponentProps } from 'utils/router';
import { withRouter } from 'utils/router';

import { styles } from './optimizations.styles';
import { OptimizationsHeader } from './optimizationsHeader';
import { OptimizationsTable } from './optimizationsTable';
import { OptimizationsToolbar } from './optimizationsToolbar';

export interface OptimizationsOwnProps extends RouterComponentProps, WrappedComponentProps {
  // TBD...
}

interface OptimizationsStateProps {
  groupBy?: string;
  query: RosQuery;
  report: RosReport;
  reportError: AxiosError;
  reportFetchStatus: FetchStatus;
  reportQueryString: string;
}

interface OptimizationsDispatchProps {
  fetchRosReport: typeof rosActions.fetchRosReport;
}

interface OptimizationsState {
  columns: any[];
  rows: any[];
}

type OptimizationsProps = OptimizationsStateProps & OptimizationsOwnProps & OptimizationsDispatchProps;

const baseQuery: RosQuery = {
  limit: 10,
  offset: 0,
  order_by: {
    cost: 'desc',
  },
};

const reportType = RosType.ros as any;
const reportPathsType = RosPathsType.recommendations as any;

class Optimizations extends React.Component<OptimizationsProps, OptimizationsState> {
  protected defaultState: OptimizationsState = {
    columns: [],
    rows: [],
  };
  public state: OptimizationsState = { ...this.defaultState };

  public componentDidMount() {
    this.updateReport();
  }

  public componentDidUpdate(prevProps: OptimizationsProps) {
    const { report, reportError, reportQueryString, router } = this.props;

    const newQuery = prevProps.reportQueryString !== reportQueryString;
    const noReport = !report && !reportError;
    const noLocation = !router.location.search;

    if (newQuery || noReport || noLocation) {
      this.updateReport();
    }
  }

  private getPagination = (isDisabled = false, isBottom = false) => {
    const { intl, query, report, router } = this.props;

    const count = report && report.meta ? report.meta.count : 0;
    const limit = report && report.meta ? report.meta.limit : baseQuery.limit;
    const offset = report && report.meta ? report.meta.offset : baseQuery.offset;
    const page = offset / limit + 1;

    return (
      <Pagination
        isCompact={!isBottom}
        isDisabled={isDisabled}
        itemCount={count}
        onPerPageSelect={(event, perPage) => handlePerPageSelect(query, router, perPage)}
        onSetPage={(event, pageNumber) => handleSetPage(query, router, report, pageNumber)}
        page={page}
        perPage={limit}
        titles={{
          paginationAriaLabel: intl.formatMessage(messages.paginationTitle, {
            title: intl.formatMessage(messages.openShift),
            placement: isBottom ? 'bottom' : 'top',
          }),
        }}
        variant={isBottom ? PaginationVariant.bottom : PaginationVariant.top}
        widgetId={`exports-pagination${isBottom ? '-bottom' : ''}`}
      />
    );
  };

  private getTable = () => {
    const { query, report, reportFetchStatus, reportQueryString, router } = this.props;

    return (
      <OptimizationsTable
        isLoading={reportFetchStatus === FetchStatus.inProgress}
        onSort={(sortType, isSortAscending) => handleSort(query, router, sortType, isSortAscending)}
        report={report}
        reportQueryString={reportQueryString}
      />
    );
  };

  private getToolbar = () => {
    const { query, report, router } = this.props;

    const itemsPerPage = report && report.meta ? report.meta.limit : 0;
    const itemsTotal = report && report.meta ? report.meta.count : 0;
    const isDisabled = itemsTotal === 0;

    return (
      <OptimizationsToolbar
        isDisabled={isDisabled}
        itemsPerPage={itemsPerPage}
        itemsTotal={itemsTotal}
        onFilterAdded={filter => handleFilterAdded(query, router, filter)}
        onFilterRemoved={filter => handleFilterRemoved(query, router, filter)}
        pagination={this.getPagination(isDisabled)}
        query={query}
      />
    );
  };

  private updateReport = () => {
    const { fetchRosReport, reportFetchStatus, reportQueryString } = this.props;

    if (reportFetchStatus !== FetchStatus.inProgress) {
      fetchRosReport(reportPathsType, reportType, reportQueryString);
    }
  };

  public render() {
    const { groupBy, intl, report, reportError, reportFetchStatus } = this.props;

    const itemsTotal = report && report.meta ? report.meta.count : 0;
    const isDisabled = itemsTotal === 0;
    const isStandalone = groupBy === undefined;
    const title = intl.formatMessage(messages.ocpDetailsTitle);

    if (reportError) {
      return <NotAvailable title={title} />;
    }
    return (
      <div style={styles.optimizationsContainer}>
        {isStandalone ? (
          <>
            <OptimizationsHeader />
            <div style={styles.content}>
              <div style={styles.toolbarContainer}>{this.getToolbar()}</div>
              {reportFetchStatus === FetchStatus.inProgress ? (
                <Loading />
              ) : (
                <>
                  <div style={styles.tableContainer}>{this.getTable()}</div>
                  <div style={styles.paginationContainer}>
                    <div style={styles.pagination}>{this.getPagination(isDisabled, true)}</div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {this.getToolbar()}
            {reportFetchStatus === FetchStatus.inProgress ? (
              <Loading />
            ) : (
              <>
                {this.getTable()}
                <div style={styles.pagination}>{this.getPagination(isDisabled, true)}</div>
              </>
            )}
          </>
        )}
      </div>
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mapStateToProps = createMapStateToProps<OptimizationsOwnProps, OptimizationsStateProps>((state, { router }) => {
  const queryFromRoute = parseQuery<RosQuery>(router.location.search);
  const groupBy = getGroupById(queryFromRoute);
  const groupByValue = getGroupByValue(queryFromRoute);

  const query = {
    ...(groupBy && {
      [groupBy]: groupByValue, // project filter
    }),
    filter_by: queryFromRoute.filter_by || baseQuery.filter_by,
    limit: queryFromRoute.limit || baseQuery.limit,
    offset: queryFromRoute.offset || baseQuery.offset,
    // order_by: queryFromRoute.order_by || baseQuery.order_by,
  };
  const reportQueryString = getQuery({
    ...query,
  });
  const report = rosSelectors.selectRos(state, reportPathsType, reportType, reportQueryString);
  const reportError = rosSelectors.selectRosError(state, reportPathsType, reportType, reportQueryString);
  const reportFetchStatus = rosSelectors.selectRosFetchStatus(state, reportPathsType, reportType, reportQueryString);

  return {
    groupBy: queryFromRoute.group_by,
    query,
    report,
    reportError,
    reportFetchStatus,
    reportQueryString,
  } as any;
});

const mapDispatchToProps: OptimizationsDispatchProps = {
  fetchRosReport: rosActions.fetchRosReport,
};

export default injectIntl(withRouter(connect(mapStateToProps, mapDispatchToProps)(Optimizations)));
