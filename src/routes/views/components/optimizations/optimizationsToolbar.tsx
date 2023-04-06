import type { ToolbarChipGroup } from '@patternfly/react-core';
import type { OcpQuery } from 'api/queries/ocpQuery';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { DataToolbar } from 'routes/views/components/dataToolbar';
import type { Filter } from 'routes/views/utils/filter';
import { createMapStateToProps } from 'store/common';

interface OptimizationsToolbarOwnProps {
  isDisabled?: boolean;
  itemsPerPage?: number;
  itemsTotal?: number;
  onFilterAdded(filter: Filter);
  onFilterRemoved(filter: Filter);
  pagination?: React.ReactNode;
  query?: OcpQuery;
}

interface OptimizationsToolbarStateProps {
  // TBD...
}

interface OptimizationsToolbarDispatchProps {
  // TBD...
}

interface OptimizationsToolbarState {
  categoryOptions?: ToolbarChipGroup[];
}

type OptimizationsToolbarProps = OptimizationsToolbarOwnProps &
  OptimizationsToolbarStateProps &
  OptimizationsToolbarDispatchProps &
  WrappedComponentProps;

export class OptimizationsToolbarBase extends React.Component<OptimizationsToolbarProps, OptimizationsToolbarState> {
  protected defaultState: OptimizationsToolbarState = {};
  public state: OptimizationsToolbarState = { ...this.defaultState };

  public componentDidMount() {
    this.setState({
      categoryOptions: this.getCategoryOptions(),
    });
  }

  private getCategoryOptions = (): ToolbarChipGroup[] => {
    const { intl } = this.props;

    const options = [
      { name: intl.formatMessage(messages.filterByValues, { value: 'cluster' }), key: 'cluster' },
      { name: intl.formatMessage(messages.filterByValues, { value: 'project' }), key: 'project' },
      { name: intl.formatMessage(messages.filterByValues, { value: 'workload_type' }), key: 'workload_type' },
      { name: intl.formatMessage(messages.filterByValues, { value: 'workload' }), key: 'workload' },
      { name: intl.formatMessage(messages.filterByValues, { value: 'container' }), key: 'container' },
    ];
    return options;
  };

  public render() {
    const { isDisabled, itemsPerPage, itemsTotal, onFilterAdded, onFilterRemoved, pagination, query } = this.props;
    const { categoryOptions } = this.state;

    return (
      <DataToolbar
        categoryOptions={categoryOptions}
        isDisabled={isDisabled}
        itemsPerPage={itemsPerPage}
        itemsTotal={itemsTotal}
        onFilterAdded={onFilterAdded}
        onFilterRemoved={onFilterRemoved}
        pagination={pagination}
        query={query}
        showFilter
      />
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mapStateToProps = createMapStateToProps<OptimizationsToolbarOwnProps, OptimizationsToolbarStateProps>(() => {
  return {
    // TBD...
  };
});

const mapDispatchToProps: OptimizationsToolbarDispatchProps = {
  // TBD...
};

const OptimizationsToolbarConnect = connect(mapStateToProps, mapDispatchToProps)(OptimizationsToolbarBase);
const OptimizationsToolbar = injectIntl(OptimizationsToolbarConnect);

export { OptimizationsToolbar };
export type { OptimizationsToolbarProps };