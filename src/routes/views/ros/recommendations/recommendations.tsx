import { Pagination, PaginationVariant } from '@patternfly/react-core';
import type { Providers } from 'api/providers';
import { ProviderType } from 'api/providers';
import { getProvidersQuery } from 'api/queries/providersQuery';
import type { RosQuery } from 'api/queries/rosQuery';
import { getQuery, parseQuery } from 'api/queries/rosQuery';
import type { Ros } from 'api/ros/ros';
import { RosPathsType, RosType } from 'api/ros/ros';
import type { AxiosError } from 'axios';
import messages from 'locales/messages';
import { cloneDeep } from 'lodash';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Loading } from 'routes/state/loading';
import { NoData } from 'routes/state/noData';
import { NoProviders } from 'routes/state/noProviders';
import { NotAvailable } from 'routes/state/notAvailable';
import { ExportModal } from 'routes/views/components/export';
import type { ColumnManagementModalOption } from 'routes/views/details/components/columnManagement';
import { ColumnManagementModal, initHiddenColumns } from 'routes/views/details/components/columnManagement';
import { getGroupByTagKey } from 'routes/views/utils/groupBy';
import {
  handleCurrencySelected,
  handleFilterAdded,
  handleFilterRemoved,
  handlePerPageSelect,
  handleSetPage,
  handleSort,
} from 'routes/views/utils/handles';
import { filterProviders, hasCurrentMonthData } from 'routes/views/utils/providers';
import { getRouteForQuery } from 'routes/views/utils/query';
import { createMapStateToProps, FetchStatus } from 'store/common';
import { featureFlagsSelectors } from 'store/featureFlags';
import { providersQuery, providersSelectors } from 'store/providers';
import { rosActions } from 'store/ros';
import { rosSelectors } from 'store/ros';
import type { ComputedReportItem } from 'utils/computedReport/getComputedReportItems';
import { getUnsortedComputedReportItems } from 'utils/computedReport/getComputedReportItems';
import { getIdKeyForGroupBy } from 'utils/computedReport/getComputedRosItems';
import { getCurrency } from 'utils/localStorage';
import { noPrefix, platformCategoryKey, tagPrefix } from 'utils/props';
import type { RouterComponentProps } from 'utils/router';
import { withRouter } from 'utils/router';

import { styles } from './recommendations.styles';
import { RosHeader } from './rosHeader';
import { RosTable, RosTableColumnIds } from './rosTable';
import { RosToolbar } from './rosToolbar';

interface RecommendationsStateProps {
  currency?: string;
  providers: Providers;
  providersFetchStatus: FetchStatus;
  query: RosQuery;
  recommendation: Ros;
  recommendationError: AxiosError;
  recommendationFetchStatus: FetchStatus;
  recommendationQueryString: string;
}

interface RecommendationsDispatchProps {
  fetchRos: typeof rosActions.fetchRos;
}

interface RecommendationsState {
  columns: any[];
  hiddenColumns: Set<string>;
  isAllSelected: boolean;
  isColumnManagementModalOpen: boolean;
  isExportModalOpen: boolean;
  rows: any[];
  selectedItems: ComputedReportItem[];
}

type RecommendationsOwnProps = RouterComponentProps & WrappedComponentProps;

type RecommendationsProps = RecommendationsStateProps & RecommendationsOwnProps & RecommendationsDispatchProps;

const baseQuery: RosQuery = {
  delta: 'cost',
  filter: {
    limit: 10,
    offset: 0,
    resolution: 'monthly',
    time_scope_units: 'month',
    time_scope_value: -1,
  },
  exclude: {},
  filter_by: {},
  group_by: {
    project: '*',
  },
  order_by: {
    cost: 'desc',
  },
};

const defaultColumnOptions: ColumnManagementModalOption[] = [
  { label: messages.monthOverMonthChange, value: RosTableColumnIds.monthOverMonth },
  {
    description: messages.ocpDetailsInfrastructureCostDesc,
    label: messages.ocpDetailsInfrastructureCost,
    value: RosTableColumnIds.infrastructure,
    hidden: true,
  },
  {
    description: messages.ocpDetailsSupplementaryCostDesc,
    label: messages.ocpDetailsSupplementaryCost,
    value: RosTableColumnIds.supplementary,
    hidden: true,
  },
];

const recommendationType = RosType.cost as any;
const recommendationPathsType = RosPathsType.recommendation as any;

class Recommendations extends React.Component<RecommendationsProps> {
  protected defaultState: RecommendationsState = {
    columns: [],
    hiddenColumns: initHiddenColumns(defaultColumnOptions),
    isAllSelected: false,
    isColumnManagementModalOpen: false,
    isExportModalOpen: false,
    rows: [],
    selectedItems: [],
  };
  public state: RecommendationsState = { ...this.defaultState };

  constructor(stateProps, dispatchProps) {
    super(stateProps, dispatchProps);
    this.handleBulkSelected = this.handleBulkSelected.bind(this);
    this.handleColumnManagementModalClose = this.handleColumnManagementModalClose.bind(this);
    this.handleColumnManagementModalOpen = this.handleColumnManagementModalOpen.bind(this);
    this.handleColumnManagementModalSave = this.handleColumnManagementModalSave.bind(this);
    this.handleExportModalClose = this.handleExportModalClose.bind(this);
    this.handleExportModalOpen = this.handleExportModalOpen.bind(this);
    this.handlePlatformCostsChanged = this.handlePlatformCostsChanged.bind(this);
    this.handleSelected = this.handleSelected.bind(this);
  }

  public componentDidMount() {
    this.updateRecommendation();
  }

  public componentDidUpdate(prevProps: RecommendationsProps, prevState: RecommendationsState) {
    const { recommendation, recommendationError, recommendationQueryString, router } = this.props;
    const { selectedItems } = this.state;

    const newQuery = prevProps.recommendationQueryString !== recommendationQueryString;
    const noRecommendation = !recommendation && !recommendationError;
    const noLocation = !router.location.search;
    const newItems = prevState.selectedItems !== selectedItems;

    if (newQuery || noRecommendation || noLocation || newItems) {
      this.updateRecommendation();
    }
  }

  private getColumnManagementModal = () => {
    const { hiddenColumns, isColumnManagementModalOpen } = this.state;

    const options = cloneDeep(defaultColumnOptions);
    options.map(option => {
      option.hidden = hiddenColumns.has(option.value);
    });

    return (
      <ColumnManagementModal
        isOpen={isColumnManagementModalOpen}
        options={options}
        onClose={this.handleColumnManagementModalClose}
        onSave={this.handleColumnManagementModalSave}
      />
    );
  };

  private getComputedItems = () => {
    const { query, recommendation } = this.props;

    const groupById = getIdKeyForGroupBy(query.group_by);
    const groupByTagKey = getGroupByTagKey(query);

    return getUnsortedComputedReportItems({
      report: recommendation,
      idKey: (groupByTagKey as any) || groupById,
    });
  };

  private getExportModal = (computedItems: ComputedReportItem[]) => {
    const { query, recommendation, recommendationQueryString } = this.props;
    const { isAllSelected, isExportModalOpen, selectedItems } = this.state;

    const groupById = getIdKeyForGroupBy(query.group_by);
    const groupByTagKey = getGroupByTagKey(query);
    const itemsTotal = recommendation && recommendation.meta ? recommendation.meta.count : 0;

    // Omit items labeled 'no-project'
    const items = [];
    selectedItems.map(item => {
      if (!(item.label === `${noPrefix}${groupById}` || item.label === `${noPrefix}${groupByTagKey}`)) {
        items.push(item);
      }
    });
    return (
      <ExportModal
        count={isAllSelected ? itemsTotal : items.length}
        isAllItems={(isAllSelected || selectedItems.length === itemsTotal) && computedItems.length > 0}
        groupBy={groupByTagKey ? `${tagPrefix}${groupByTagKey}` : groupById}
        isOpen={isExportModalOpen}
        items={items}
        onClose={this.handleExportModalClose}
        reportPathsType={recommendationPathsType}
        reportQueryString={recommendationQueryString}
      />
    );
  };

  private getPagination = (isBottom: boolean = false) => {
    const { intl, query, recommendation, router } = this.props;

    const count = recommendation && recommendation.meta ? recommendation.meta.count : 0;
    const limit =
      recommendation && recommendation.meta && recommendation.meta.filter && recommendation.meta.filter.limit
        ? recommendation.meta.filter.limit
        : baseQuery.filter.limit;
    const offset =
      recommendation && recommendation.meta && recommendation.meta.filter && recommendation.meta.filter.offset
        ? recommendation.meta.filter.offset
        : baseQuery.filter.offset;
    const page = offset / limit + 1;

    return (
      <Pagination
        isCompact={!isBottom}
        itemCount={count}
        onPerPageSelect={(event, perPage) => handlePerPageSelect(query, router, perPage)}
        onSetPage={(event, pageNumber) => handleSetPage(query, router, recommendation, pageNumber)}
        page={page}
        perPage={limit}
        titles={{
          paginationTitle: intl.formatMessage(messages.paginationTitle, {
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
    const { query, recommendation, recommendationFetchStatus, recommendationQueryString, router } = this.props;
    const { hiddenColumns, isAllSelected, selectedItems } = this.state;

    const groupById = getIdKeyForGroupBy(query.group_by);
    const groupByTagKey = getGroupByTagKey(query);

    return (
      <RosTable
        groupBy={groupByTagKey ? `${tagPrefix}${groupByTagKey}` : groupById}
        groupByTagKey={groupByTagKey}
        hiddenColumns={hiddenColumns}
        isAllSelected={isAllSelected}
        isLoading={recommendationFetchStatus === FetchStatus.inProgress}
        onSelected={this.handleSelected}
        onSort={(sortType, isSortAscending) => handleSort(query, router, sortType, isSortAscending)}
        report={recommendation}
        reportQueryString={recommendationQueryString}
        selectedItems={selectedItems}
      />
    );
  };

  private getToolbar = (computedItems: ComputedReportItem[]) => {
    const { query, recommendation, router } = this.props;
    const { isAllSelected, selectedItems } = this.state;

    const groupById = getIdKeyForGroupBy(query.group_by);
    const groupByTagKey = getGroupByTagKey(query);
    const itemsTotal = recommendation && recommendation.meta ? recommendation.meta.count : 0;

    return (
      <RosToolbar
        groupBy={groupByTagKey ? `${tagPrefix}${groupByTagKey}` : groupById}
        isAllSelected={isAllSelected}
        isExportDisabled={computedItems.length === 0 || (!isAllSelected && selectedItems.length === 0)}
        itemsPerPage={computedItems.length}
        itemsTotal={itemsTotal}
        onBulkSelected={this.handleBulkSelected}
        onColumnManagementClicked={this.handleColumnManagementModalOpen}
        onExportClicked={this.handleExportModalOpen}
        onFilterAdded={filter => handleFilterAdded(query, router, filter)}
        onFilterRemoved={filter => handleFilterRemoved(query, router, filter)}
        onPlatformCostsChanged={this.handlePlatformCostsChanged}
        pagination={this.getPagination()}
        query={query}
        selectedItems={selectedItems}
      />
    );
  };

  private handleBulkSelected = (action: string) => {
    const { isAllSelected } = this.state;

    if (action === 'none') {
      this.setState({ isAllSelected: false, selectedItems: [] });
    } else if (action === 'page') {
      this.setState({
        isAllSelected: false,
        selectedItems: this.getComputedItems(),
      });
    } else if (action === 'all') {
      this.setState({ isAllSelected: !isAllSelected, selectedItems: [] });
    }
  };

  public handleColumnManagementModalClose = (isOpen: boolean) => {
    this.setState({ isColumnManagementModalOpen: isOpen });
  };

  public handleColumnManagementModalOpen = () => {
    this.setState({ isColumnManagementModalOpen: true });
  };

  public handleColumnManagementModalSave = (hiddenColumns: Set<string>) => {
    this.setState({ hiddenColumns });
  };

  public handleExportModalClose = (isOpen: boolean) => {
    this.setState({ isExportModalOpen: isOpen });
  };

  public handleExportModalOpen = () => {
    this.setState({ isExportModalOpen: true });
  };

  private handleGroupBySelected = groupBy => {
    const { query, router } = this.props;
    const groupByKey: keyof RosQuery['group_by'] = groupBy as any;
    const newQuery = {
      ...JSON.parse(JSON.stringify(query)),
      // filter_by: undefined, // Preserve filter -- see https://issues.redhat.com/browse/COST-1090
      group_by: {
        [groupByKey]: '*',
      },
      order_by: { cost: 'desc' },
      category: undefined, // Only applies to projects
    };
    this.setState({ isAllSelected: false, selectedItems: [] }, () => {
      router.navigate(getRouteForQuery(newQuery, router.location, true), { replace: true });
    });
  };

  private handlePlatformCostsChanged = (checked: boolean) => {
    const { query, router } = this.props;
    const newQuery = {
      ...JSON.parse(JSON.stringify(query)),
      category: checked ? platformCategoryKey : undefined,
    };
    this.setState({ isAllSelected: false, selectedItems: [] }, () => {
      router.navigate(getRouteForQuery(newQuery, router.location, true), { replace: true });
    });
  };

  private handleSelected = (items: ComputedReportItem[], isSelected: boolean = false) => {
    const { isAllSelected, selectedItems } = this.state;

    let newItems = [...(isAllSelected ? this.getComputedItems() : selectedItems)];
    if (items && items.length > 0) {
      if (isSelected) {
        items.map(item => newItems.push(item));
      } else {
        items.map(item => {
          newItems = newItems.filter(val => val.id !== item.id);
        });
      }
    }
    this.setState({ isAllSelected: false, selectedItems: newItems });
  };

  private updateRecommendation = () => {
    const { fetchRos, recommendationQueryString } = this.props;
    fetchRos(recommendationPathsType, recommendationType, recommendationQueryString);
  };

  public render() {
    const {
      currency,
      intl,
      providers,
      providersFetchStatus,
      query,
      recommendation,
      recommendationError,
      recommendationFetchStatus,
      router,
    } = this.props;

    const groupById = getIdKeyForGroupBy(query.group_by);
    const computedItems = this.getComputedItems();
    const title = intl.formatMessage(messages.ocpDetailsTitle);

    // Note: Providers are fetched via the AccountSettings component used by all routes
    if (recommendationError) {
      return <NotAvailable title={title} />;
    } else if (providersFetchStatus === FetchStatus.inProgress) {
      return <Loading title={title} />;
    } else if (providersFetchStatus === FetchStatus.complete) {
      // API returns empy data array for no sources
      const noProviders = providers && providers.meta && providers.meta.count === 0;

      if (noProviders) {
        return <NoProviders providerType={ProviderType.ros} title={title} />;
      }
      if (!hasCurrentMonthData(providers)) {
        return <NoData title={title} />;
      }
    }
    return (
      <div style={styles.rosDetails}>
        <RosHeader
          currency={currency}
          groupBy={groupById}
          onCurrencySelected={value => handleCurrencySelected(query, router, value)}
          onGroupBySelected={this.handleGroupBySelected}
          report={recommendation}
        />
        <div style={styles.content}>
          {this.getToolbar(computedItems)}
          {this.getExportModal(computedItems)}
          {this.getColumnManagementModal()}
          {recommendationFetchStatus === FetchStatus.inProgress ? (
            <Loading />
          ) : (
            <>
              <div style={styles.tableContainer}>{this.getTable()}</div>
              <div style={styles.paginationContainer}>
                <div style={styles.pagination}>{this.getPagination(true)}</div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mapStateToProps = createMapStateToProps<RecommendationsOwnProps, RecommendationsStateProps>(
  (state, { router }) => {
    const queryFromRoute = parseQuery<RosQuery>(router.location.search);
    const currency = featureFlagsSelectors.selectIsCurrencyFeatureEnabled(state) ? getCurrency() : undefined;
    const query = {
      delta: 'cost',
      filter: {
        ...baseQuery.filter,
        ...queryFromRoute.filter,
      },
      filter_by: queryFromRoute.filter_by || baseQuery.filter_by,
      exclude: queryFromRoute.exclude || baseQuery.exclude,
      group_by: queryFromRoute.group_by || baseQuery.group_by,
      order_by: queryFromRoute.order_by || baseQuery.order_by,
      category: queryFromRoute.category,
    };
    const recommendationQueryString = getQuery({
      ...query,
      currency,
    });
    const recommendation = rosSelectors.selectRos(
      state,
      recommendationPathsType,
      recommendationType,
      recommendationQueryString
    );
    const recommendationError = rosSelectors.selectRosError(
      state,
      recommendationPathsType,
      recommendationType,
      recommendationQueryString
    );
    const recommendationFetchStatus = rosSelectors.selectRosFetchStatus(
      state,
      recommendationPathsType,
      recommendationType,
      recommendationQueryString
    );

    const providersQueryString = getProvidersQuery(providersQuery);
    const providers = providersSelectors.selectProviders(state, ProviderType.all, providersQueryString);
    const providersFetchStatus = providersSelectors.selectProvidersFetchStatus(
      state,
      ProviderType.all,
      providersQueryString
    );

    return {
      currency,
      providers: filterProviders(providers, ProviderType.ocp),
      providersFetchStatus,
      query,
      recommendation,
      recommendationError,
      recommendationFetchStatus,
      recommendationQueryString,
    } as any;
  }
);

const mapDispatchToProps: RecommendationsDispatchProps = {
  fetchRos: rosActions.fetchRos,
};

export default injectIntl(withRouter(connect(mapStateToProps, mapDispatchToProps)(Recommendations)));