import './dataToolbar.scss';

import type { ToolbarChipGroup } from '@patternfly/react-core';
import { Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem, ToolbarToggleGroup } from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import type { Org } from 'api/orgs/org';
import type { Query } from 'api/queries/query';
import type { Resource, ResourcePathsType } from 'api/resources/resource';
import type { Tag } from 'api/tags/tag';
import type { TagPathsType } from 'api/tags/tag';
import { cloneDeep } from 'lodash';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import type { ComputedReportItem } from 'routes/utils/computedReport/getComputedReportItems';
import { isEqual } from 'routes/utils/equal';
import type { Filter } from 'routes/utils/filter';
import { createMapStateToProps } from 'store/common';
import { awsCategoryKey, orgUnitIdKey, platformCategoryKey, tagKey } from 'utils/props';

import { styles } from './dataToolbar.styles';
import { getColumnManagement, getExportButton, getKebab, getPlatformCosts } from './utils/actions';
import { getBulkSelect } from './utils/bulkSelect';
import type { CategoryOption } from './utils/category';
import {
  getCategoryInput,
  getCategorySelect,
  getDefaultCategoryOptions,
  onCategoryInput,
  onCategoryInputSelect,
  onWorkloadTypeSelect,
} from './utils/category';
import type { Filters } from './utils/common';
import { cleanInput, defaultFilters, getActiveFilters, getDefaultCategory, onDelete } from './utils/common';
import {
  getCostCategoryKeyOptions,
  getCostCategoryKeySelect,
  getCostCategoryValueSelect,
  onCostCategoryValueInput,
  onCostCategoryValueSelect,
} from './utils/costCategory';
import type { ExcludeOption } from './utils/exclude';
import { ExcludeType, getExcludeSelect } from './utils/exclude';
import { getOrgUnitSelect, onOrgUnitSelect } from './utils/orgUntits';
import { getTagKeyOptions, getTagKeySelect, getTagValueSelect, onTagValueInput, onTagValueSelect } from './utils/tags';

interface DataToolbarOwnProps {
  categoryOptions?: ToolbarChipGroup[]; // Options for category menu
  className?: string;
  dateRange?: React.ReactNode; // Optional date range controls to display in toolbar
  datePicker?: React.ReactNode; // Optional date picker controls to display in toolbar
  groupBy?: string; // Sync category selection with groupBy value
  isAllSelected?: boolean;
  isBulkSelectDisabled?: boolean;
  isDisabled?: boolean;
  isExportDisabled?: boolean; // Show export icon as disabled
  itemsPerPage?: number;
  itemsTotal?: number;
  onBulkSelected?: (action: string) => void;
  onColumnManagementClicked?: () => void;
  onExportClicked?: () => void;
  onFilterAdded?: (filter: Filter) => void;
  onFilterRemoved?: (filterType: Filter) => void;
  onPlatformCostsChanged?: (checked: boolean) => void;
  orgReport?: Org; // Report containing AWS organizational unit data
  pagination?: React.ReactNode; // Optional pagination controls to display in toolbar
  query?: Query; // Query containing filter_by params used to restore state upon page refresh
  resourcePathsType?: ResourcePathsType;
  resourceReport?: Resource;
  selectedItems?: ComputedReportItem[];
  showBulkSelect?: boolean; // Show bulk select
  showColumnManagement?: boolean; // Show column management
  showExcludes?: boolean; // Show negative filtering
  showExport?: boolean; // Show export icon
  showFilter?: boolean; // Show export icon
  showPlatformCosts?: boolean; // Show platform costs switch
  style?: React.CSSProperties;
  tagPathsType?: TagPathsType;
  tagReport?: Tag; // Data containing tag key and value data
}

interface DataToolbarState {
  categoryInput?: string;
  costCategoryKeyValueInput?: string;
  currentCategory?: string;
  currentExclude?: string;
  currentCostCategoryKey?: string;
  currentTagKey?: string;
  filters?: Filters;
  isBulkSelectOpen?: boolean;
  isCategorySelectOpen?: boolean;
  isCostCategoryKeySelectExpanded?: boolean;
  isCostCategoryValueSelectExpanded?: boolean;
  isExcludeSelectOpen?: boolean;
  isOrgUnitSelectExpanded?: boolean;
  isPlatformCostsChecked?: boolean;
  isTagKeySelectExpanded?: boolean;
  isTagValueSelectExpanded?: boolean;
  tagKeyValueInput?: string;
}

interface DataToolbarStateProps {
  // TBD...
}

type DataToolbarProps = DataToolbarOwnProps & DataToolbarStateProps & WrappedComponentProps;

export class DataToolbarBase extends React.Component<DataToolbarProps, DataToolbarState> {
  protected defaultState: DataToolbarState = {
    categoryInput: '',
    filters: cloneDeep(defaultFilters),
    isBulkSelectOpen: false,
    isCategorySelectOpen: false,
    isCostCategoryKeySelectExpanded: false,
    isCostCategoryValueSelectExpanded: false,
    isExcludeSelectOpen: false,
    isOrgUnitSelectExpanded: false,
    isPlatformCostsChecked: this.props.query ? this.props.query.category === platformCategoryKey : false,
    isTagKeySelectExpanded: false,
    isTagValueSelectExpanded: false,
    tagKeyValueInput: '',
  };
  public state: DataToolbarState = { ...this.defaultState };

  public componentDidMount() {
    const { categoryOptions, groupBy, query } = this.props;

    this.setState({
      currentCategory: getDefaultCategory(categoryOptions, groupBy, query),
      currentExclude: ExcludeType.include,
    });
  }

  public componentDidUpdate(prevProps: DataToolbarProps) {
    const { categoryOptions, groupBy, orgReport, query, resourceReport, tagReport } = this.props;

    if (
      groupBy !== prevProps.groupBy ||
      (categoryOptions && !isEqual(categoryOptions, prevProps.categoryOptions)) ||
      (query && !isEqual(query, prevProps.query)) ||
      (orgReport && !isEqual(orgReport, prevProps.orgReport)) ||
      (resourceReport && !isEqual(resourceReport, prevProps.resourceReport)) ||
      (tagReport && !isEqual(tagReport, prevProps.tagReport))
    ) {
      this.setState(() => {
        const filters = getActiveFilters(query);
        return categoryOptions !== prevProps.categoryOptions || prevProps.groupBy !== groupBy
          ? {
              categoryInput: '',
              costCategoryKeyValueInput: '',
              currentCategory: getDefaultCategory(categoryOptions, groupBy, query),
              currentCostCategoryKey: '',
              currentTagKey: '',
              filters,
              tagKeyValueInput: '',
              ...(prevProps.groupBy !== groupBy && { isPlatformCostsChecked: false }),
            }
          : {
              filters,
            };
      });
    }
  }

  // Common

  private handleOnDelete = (type: any, chip: any) => {
    const { onFilterRemoved } = this.props;
    const { filters: currentFilters } = this.state;

    const { filter, filters } = onDelete(type, chip, currentFilters);

    this.setState({ filters }, () => {
      if (onFilterRemoved) {
        onFilterRemoved(filter);
      }
    });
  };

  // Bulk select

  public getBulkSelectComponent = () => {
    const { isAllSelected, isBulkSelectDisabled, isDisabled, itemsPerPage, itemsTotal, selectedItems } = this.props;
    const { isBulkSelectOpen } = this.state;

    return getBulkSelect({
      handleOnBulkSelect: this.handleOnBulkSelect,
      handleOnBulkSelectClicked: this.handleOnBulkSelectClicked,
      handleOnBulkSelectToggle: this.handleOnBulkSelectToggle,
      isAllSelected,
      isBulkSelectDisabled,
      isBulkSelectOpen,
      isDisabled,
      itemsPerPage,
      itemsTotal,
      selectedItems,
    });
  };

  private handleOnBulkSelectClicked = (action: string) => {
    const { onBulkSelected } = this.props;

    if (onBulkSelected) {
      onBulkSelected(action);
    }
  };

  private handleOnBulkSelect = () => {
    this.setState({
      isBulkSelectOpen: !this.state.isBulkSelectOpen,
    });
  };

  private handleOnBulkSelectToggle = isOpen => {
    this.setState({
      isBulkSelectOpen: isOpen,
    });
  };

  // Category select

  public getCategorySelectComponent() {
    const { categoryOptions, isDisabled } = this.props;
    const { currentCategory, filters, isCategorySelectOpen } = this.state;

    return getCategorySelect({
      categoryOptions,
      currentCategory,
      isDisabled,
      filters,
      handleOnCategorySelect: this.handleOnCategorySelect,
      handleOnCategoryToggle: this.handleOnCategoryToggle,
      isCategorySelectOpen,
    });
  }

  private handleOnCategorySelect = (event, selection: CategoryOption) => {
    this.setState({
      categoryInput: '',
      currentCategory: selection.value,
      currentCostCategoryKey: undefined,
      currentTagKey: undefined,
      isCategorySelectOpen: !this.state.isCategorySelectOpen,
    });
  };

  private handleOnCategoryToggle = isOpen => {
    this.setState({
      isCategorySelectOpen: isOpen,
    });
  };

  // Category input

  public getCategoryInputComponent = (categoryOption: ToolbarChipGroup) => {
    const { isDisabled, resourcePathsType } = this.props;
    const { categoryInput, currentCategory, filters } = this.state;

    return getCategoryInput({
      categoryInput,
      categoryOption,
      currentCategory,
      filters,
      handleOnCategoryInput: this.handleOnCategoryInput,
      handleOnCategoryInputChange: this.handleOnCategoryInputChange,
      handleOnCategoryInputSelect: this.handleOnCategoryInputSelect,
      handleOnDelete: this.handleOnDelete,
      handleOnWorkloadTypeSelect: this.handleOnWorkloadTypeSelect,
      isDisabled,
      resourcePathsType,
    });
  };

  private handleOnCategoryInputChange = (value: string) => {
    const val = cleanInput(value);
    this.setState({ categoryInput: val });
  };

  private handleOnCategoryInput = (event, key) => {
    const { onFilterAdded } = this.props;
    const { categoryInput, currentCategory, currentExclude, filters: currentFilters } = this.state;

    const { filter, filters } = onCategoryInput({
      categoryInput,
      currentCategory,
      currentExclude,
      currentFilters,
      event,
      key,
    });

    this.setState(
      {
        filters,
        categoryInput: '',
      },
      () => {
        if (onFilterAdded) {
          onFilterAdded(filter);
        }
      }
    );
  };

  private handleOnCategoryInputSelect = (value, key) => {
    const { onFilterAdded } = this.props;
    const { currentCategory, currentExclude, filters: currentFilters } = this.state;

    const { filter, filters } = onCategoryInputSelect({
      currentCategory,
      currentExclude,
      currentFilters,
      key,
      value,
    });

    this.setState(
      {
        filters,
      },
      () => {
        if (onFilterAdded) {
          onFilterAdded(filter);
        }
      }
    );
  };

  private handleOnWorkloadTypeSelect = (event, selection) => {
    const { onFilterAdded, onFilterRemoved } = this.props;
    const { currentCategory, filters: currentFilters } = this.state;

    const { filter, filters } = onWorkloadTypeSelect({
      currentCategory,
      currentFilters,
      event,
      selection,
    });

    this.setState(
      {
        filters,
      },
      () => {
        if (event.target.checked) {
          if (onFilterAdded) {
            onFilterAdded(filter);
          }
        } else {
          if (onFilterRemoved) {
            onFilterRemoved(filter);
          }
        }
      }
    );
  };

  // Cost category key select

  public getCostCategoryKeySelectComponent = () => {
    const { isDisabled, resourceReport } = this.props;
    const { currentCategory, currentCostCategoryKey, filters, isCostCategoryKeySelectExpanded } = this.state;

    return getCostCategoryKeySelect({
      currentCategory,
      currentCostCategoryKey,
      filters,
      handleOnCostCategoryKeyClear: this.handleOnCostCategoryKeyClear,
      handleOnCostCategoryKeySelect: this.handleOnCostCategoryKeySelect,
      handleOnCostCategoryKeyToggle: this.handleOnCostCategoryKeyToggle,
      isCostCategoryKeySelectExpanded,
      isDisabled,
      resourceReport,
    });
  };

  private handleOnCostCategoryKeyClear = () => {
    this.setState({
      currentCostCategoryKey: undefined,
      isCostCategoryKeySelectExpanded: false,
    });
  };

  private handleOnCostCategoryKeySelect = (event, selection) => {
    this.setState({
      currentCostCategoryKey: selection,
      isCostCategoryKeySelectExpanded: !this.state.isCostCategoryKeySelectExpanded,
    });
  };

  private handleOnCostCategoryKeyToggle = isOpen => {
    this.setState({
      isCostCategoryKeySelectExpanded: isOpen,
    });
  };

  // Cost category value select

  public getCostCategoryValueSelectComponent = (costCategoryKeyOption: ToolbarChipGroup) => {
    const { isDisabled, resourcePathsType } = this.props;
    const { currentCategory, currentCostCategoryKey, filters, costCategoryKeyValueInput } = this.state;

    return getCostCategoryValueSelect({
      currentCategory,
      currentCostCategoryKey,
      costCategoryKeyOption,
      costCategoryKeyValueInput,
      filters,
      handleOnDelete: this.handleOnDelete,
      handleOnCostCategoryValueSelect: this.handleOnCostCategoryValueSelect,
      handleOnCostCategoryValueInput: this.handleOnCostCategoryValueInput,
      handleOnCostCategoryValueInputChange: this.handleOnCostCategoryValueInputChange,
      isDisabled,
      resourcePathsType,
    });
  };

  private handleOnCostCategoryValueInputChange = value => {
    this.setState({ costCategoryKeyValueInput: value });
  };

  private handleOnCostCategoryValueInput = event => {
    const { onFilterAdded } = this.props;
    const { currentExclude, currentCostCategoryKey, costCategoryKeyValueInput, filters: currentFilters } = this.state;

    const { filter, filters } = onCostCategoryValueInput({
      costCategoryKeyValueInput,
      currentCostCategoryKey,
      currentFilters,
      currentExclude,
      event,
    });

    this.setState(
      {
        filters,
        costCategoryKeyValueInput: '',
      },
      () => {
        if (onFilterAdded) {
          this.props.onFilterAdded(filter);
        }
      }
    );
  };

  private handleOnCostCategoryValueSelect = (event, selection) => {
    const { onFilterAdded, onFilterRemoved } = this.props;
    const { currentExclude, currentCostCategoryKey, filters: currentFilters } = this.state;

    const { filter, filters } = onCostCategoryValueSelect({
      currentCostCategoryKey,
      currentFilters,
      currentExclude,
      event,
      selection,
    });

    this.setState(
      {
        filters,
      },
      () => {
        if (event.target.checked) {
          if (onFilterAdded) {
            onFilterAdded(filter);
          }
        } else {
          if (onFilterRemoved) {
            onFilterRemoved(filter);
          }
        }
      }
    );
  };

  // Exclude select

  public getExcludeSelectComponent() {
    const { isDisabled } = this.props;
    const { currentExclude, filters, isExcludeSelectOpen } = this.state;

    return getExcludeSelect({
      currentExclude,
      filters,
      handleOnExcludeSelect: this.handleOnExcludeSelect,
      handleOnExcludeToggle: this.handleOnExcludeToggle,
      isDisabled,
      isExcludeSelectOpen,
    });
  }

  private handleOnExcludeSelect = (event, selection: ExcludeOption) => {
    this.setState({
      currentExclude: selection.value,
      isExcludeSelectOpen: !this.state.isExcludeSelectOpen,
    });
  };

  private handleOnExcludeToggle = isOpen => {
    this.setState({
      isExcludeSelectOpen: isOpen,
    });
  };

  // Org unit select
  public getOrgUnitSelectComponent = () => {
    const { isDisabled, orgReport } = this.props;
    const { currentCategory, filters, isOrgUnitSelectExpanded } = this.state;

    return getOrgUnitSelect({
      currentCategory,
      filters,
      handleOnDelete: this.handleOnDelete,
      handleOnOrgUnitSelect: this.handleOnOrgUnitSelect,
      handleOnOrgUnitToggle: this.handleOnOrgUnitToggle,
      isDisabled,
      isOrgUnitSelectExpanded,
      orgReport,
    });
  };

  private handleOnOrgUnitSelect = (event, selection) => {
    const { onFilterAdded, onFilterRemoved } = this.props;
    const { currentExclude, filters: currentFilters } = this.state;

    const { filter, filters } = onOrgUnitSelect({
      currentExclude,
      currentFilters,
      event,
      selection,
    });

    this.setState(
      {
        filters,
      },
      () => {
        if (event.target.checked) {
          if (onFilterAdded) {
            onFilterAdded(filter);
          }
        } else {
          if (onFilterRemoved) {
            onFilterRemoved(filter);
          }
        }
      }
    );
  };

  private handleOnOrgUnitToggle = isOpen => {
    this.setState({
      isOrgUnitSelectExpanded: isOpen,
    });
  };

  // Tag key select

  public getTagKeySelectComponent = () => {
    const { isDisabled, tagReport } = this.props;
    const { currentCategory, currentTagKey, filters, isTagKeySelectExpanded } = this.state;

    return getTagKeySelect({
      currentCategory,
      currentTagKey,
      filters,
      handleOnTagKeyClear: this.handleOnTagKeyClear,
      handleOnTagKeySelect: this.handleOnTagKeySelect,
      handleOnTagKeyToggle: this.handleOnTagKeyToggle,
      isDisabled,
      isTagKeySelectExpanded,
      tagReport,
    });
  };

  private handleOnTagKeyClear = () => {
    this.setState({
      currentTagKey: undefined,
      isTagKeySelectExpanded: false,
    });
  };

  private handleOnTagKeySelect = (event, selection) => {
    this.setState({
      currentTagKey: selection,
      isTagKeySelectExpanded: !this.state.isTagKeySelectExpanded,
    });
  };

  private handleOnTagKeyToggle = isOpen => {
    this.setState({
      isTagKeySelectExpanded: isOpen,
    });
  };

  // Tag value select

  public getTagValueSelect = (tagKeyOption: ToolbarChipGroup) => {
    const { isDisabled, tagPathsType } = this.props;
    const { currentCategory, currentTagKey, filters, tagKeyValueInput } = this.state;

    return getTagValueSelect({
      currentCategory,
      currentTagKey,
      filters,
      handleOnDelete: this.handleOnDelete,
      handleOnTagValueSelect: this.handleOnTagValueSelect,
      handleOnTagValueInput: this.handleOnTagValueInput,
      handleOnTagValueInputChange: this.handleOnTagValueInputChange,
      isDisabled,
      tagKeyOption,
      tagPathsType,
      tagKeyValueInput,
    });
  };

  private handleOnTagValueInputChange = value => {
    this.setState({ tagKeyValueInput: value });
  };

  private handleOnTagValueInput = event => {
    const { onFilterAdded } = this.props;
    const { currentExclude, currentTagKey, filters: currentFilters, tagKeyValueInput } = this.state;

    const { filter, filters } = onTagValueInput({
      currentExclude,
      currentFilters,
      currentTagKey,
      event,
      tagKeyValueInput,
    });

    this.setState(
      {
        filters,
        tagKeyValueInput: '',
      },
      () => {
        if (onFilterAdded) {
          onFilterAdded(filter);
        }
      }
    );
  };

  private handleOnTagValueSelect = (event, selection) => {
    const { onFilterAdded, onFilterRemoved } = this.props;
    const { currentExclude, currentTagKey, filters: currentFilters } = this.state;

    const { filter, filters } = onTagValueSelect({
      currentExclude,
      currentFilters,
      currentTagKey,
      event,
      selection,
    });

    this.setState(
      {
        filters,
      },
      () => {
        if (event.target.checked) {
          if (onFilterAdded) {
            onFilterAdded(filter);
          }
        } else {
          if (onFilterRemoved) {
            onFilterRemoved(filter);
          }
        }
      }
    );
  };

  // Column management

  public getColumnManagementComponent = () => {
    const { isDisabled } = this.props;

    return getColumnManagement({
      handleColumnManagementClicked: this.handleColumnManagementClicked,
      isDisabled,
    });
  };

  private handleColumnManagementClicked = () => {
    const { onColumnManagementClicked } = this.props;
    if (onColumnManagementClicked) {
      onColumnManagementClicked();
    }
  };

  // Export button

  public getExportButtonComponent = () => {
    const { isDisabled, isExportDisabled } = this.props;

    return getExportButton({
      handleExportClicked: this.handleExportClicked,
      isDisabled,
      isExportDisabled,
    });
  };

  private handleExportClicked = () => {
    const { onExportClicked } = this.props;
    if (onExportClicked) {
      onExportClicked();
    }
  };

  // Platform costs

  public getPlatformCostsComponent = () => {
    const { isDisabled } = this.props;
    const { isPlatformCostsChecked } = this.state;

    return getPlatformCosts({
      handlePlatformCostsChanged: this.handlePlatformCostsChanged,
      isDisabled,
      isPlatformCostsChecked,
    });
  };

  private handlePlatformCostsChanged = (checked: boolean) => {
    const { onPlatformCostsChanged } = this.props;
    const { isPlatformCostsChecked } = this.state;
    this.setState({ isPlatformCostsChecked: !isPlatformCostsChecked }, () => {
      if (onPlatformCostsChanged) {
        onPlatformCostsChanged(checked);
      }
    });
  };

  // Kebab

  public getKebab = () => {
    const { showColumnManagement, showPlatformCosts } = this.props;
    const { isPlatformCostsChecked } = this.state;

    return getKebab({
      handleColumnManagementClicked: this.handleColumnManagementClicked,
      handlePlatformCostsChanged: this.handlePlatformCostsChanged,
      isPlatformCostsChecked,
      showColumnManagement,
      showPlatformCosts,
    });
  };

  public render() {
    const {
      categoryOptions,
      className,
      dateRange,
      datePicker,
      pagination,
      resourceReport,
      showBulkSelect,
      showColumnManagement,
      showExcludes,
      showExport,
      showFilter,
      showPlatformCosts,
      style,
      tagReport,
    } = this.props;
    const options = categoryOptions ? categoryOptions : getDefaultCategoryOptions();

    // Todo: clearAllFilters workaround https://github.com/patternfly/patternfly-react/issues/4222
    return (
      <div className={className} style={style ? style : styles.toolbarContainer}>
        <Toolbar
          className="toolbarOverride"
          clearAllFilters={this.handleOnDelete as any}
          collapseListedFiltersBreakpoint="xl"
        >
          <ToolbarContent>
            {showBulkSelect && <ToolbarItem variant="bulk-select">{this.getBulkSelectComponent()}</ToolbarItem>}
            {showFilter && (
              <ToolbarToggleGroup breakpoint="xl" toggleIcon={<FilterIcon />}>
                <ToolbarGroup variant="filter-group">
                  {this.getCategorySelectComponent()}
                  {showExcludes && this.getExcludeSelectComponent()}
                  {this.getCostCategoryKeySelectComponent()}
                  {getCostCategoryKeyOptions(resourceReport).map(option =>
                    this.getCostCategoryValueSelectComponent(option)
                  )}
                  {this.getTagKeySelectComponent()}
                  {getTagKeyOptions(tagReport).map(option => this.getTagValueSelect(option))}
                  {this.getOrgUnitSelectComponent()}
                  {options &&
                    options
                      .filter(
                        option => option.key !== awsCategoryKey && option.key !== tagKey && option.key !== orgUnitIdKey
                      )
                      .map(option => this.getCategoryInputComponent(option))}
                </ToolbarGroup>
              </ToolbarToggleGroup>
            )}
            {(showExport || showColumnManagement) && (
              <ToolbarGroup>
                {showColumnManagement && this.getColumnManagementComponent()}
                {showPlatformCosts && this.getPlatformCostsComponent()}
                {showExport && this.getExportButtonComponent()}
                {(showColumnManagement || showPlatformCosts) && this.getKebab()}
              </ToolbarGroup>
            )}
            {(dateRange || datePicker) && (
              <ToolbarGroup>
                {dateRange}
                {datePicker}
              </ToolbarGroup>
            )}
            <ToolbarItem align={{ default: 'alignRight' }} variant="pagination">
              {pagination}
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </div>
    );
  }
}

const mapStateToProps = createMapStateToProps<DataToolbarOwnProps, DataToolbarStateProps>(() => {
  return {
    // TBD...
  };
});

const DataToolbar = injectIntl(connect(mapStateToProps, {})(DataToolbarBase));

export default DataToolbar;
