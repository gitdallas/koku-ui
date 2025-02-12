import 'routes/views/details/components/dataTable/dataTable.scss';

import type { OciReport } from 'api/reports/ociReports';
import { ReportPathsType } from 'api/reports/report';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { routes } from 'routes';
import { EmptyValueState } from 'routes/components/state/emptyValueState';
import { Actions } from 'routes/views/details/components/actions';
import { DataTable } from 'routes/views/details/components/dataTable';
import { styles } from 'routes/views/details/components/dataTable/dataTable.styles';
import { getBreakdownPath } from 'routes/views/utils/paths';
import type { ComputedReportItem } from 'utils/computedReport/getComputedReportItems';
import { getUnsortedComputedReportItems } from 'utils/computedReport/getComputedReportItems';
import { getForDateRangeString, getNoDataForDateRangeString } from 'utils/dates';
import { formatCurrency, formatPercentage } from 'utils/format';
import { formatPath } from 'utils/paths';
import { noPrefix } from 'utils/props';
import type { RouterComponentProps } from 'utils/router';
import { withRouter } from 'utils/router';

interface DetailsTableOwnProps extends RouterComponentProps, WrappedComponentProps {
  isAllSelected?: boolean;
  groupBy: string;
  groupByTagKey?: string;
  isLoading?: boolean;
  onSelected(items: ComputedReportItem[], isSelected: boolean);
  onSort(value: string, isSortAscending: boolean);
  report: OciReport;
  reportQueryString: string;
  selectedItems?: ComputedReportItem[];
}

interface DetailsTableState {
  columns?: any[];
  rows?: any[];
}

type DetailsTableProps = DetailsTableOwnProps;

const reportPathsType = ReportPathsType.oci;

class DetailsTableBase extends React.Component<DetailsTableProps, DetailsTableState> {
  public state: DetailsTableState = {
    columns: [],
    rows: [],
  };

  public componentDidMount() {
    this.initDatum();
  }

  public componentDidUpdate(prevProps: DetailsTableProps) {
    const { report, selectedItems } = this.props;
    const currentReport = report && report.data ? JSON.stringify(report.data) : '';
    const previousReport = prevProps.report && prevProps.report.data ? JSON.stringify(prevProps.report.data) : '';

    if (previousReport !== currentReport || prevProps.selectedItems !== selectedItems) {
      this.initDatum();
    }
  }

  private initDatum = () => {
    const { groupBy, groupByTagKey, intl, isAllSelected, report, router, selectedItems } = this.props;
    if (!report) {
      return;
    }

    const rows = [];
    const computedItems = getUnsortedComputedReportItems({
      report,
      idKey: (groupByTagKey ? groupByTagKey : groupBy) as any,
    });

    const columns = groupByTagKey
      ? [
          {
            name: '',
          },
          {
            name: intl.formatMessage(messages.tagNames),
          },
          {
            name: intl.formatMessage(messages.monthOverMonthChange),
          },
          {
            orderBy: 'cost',
            name: intl.formatMessage(messages.cost),
            style: styles.costColumn,
            ...(computedItems.length && { isSortable: true }),
          },
          {
            name: '',
          },
        ]
      : [
          {
            name: '',
          },
          {
            orderBy: groupBy,
            name: intl.formatMessage(messages.detailsResourceNames, { value: groupBy }),
            ...(computedItems.length && { isSortable: true }),
          },
          {
            name: intl.formatMessage(messages.monthOverMonthChange),
          },
          {
            orderBy: 'cost',
            name: intl.formatMessage(messages.cost),
            style: styles.costColumn,
            ...(computedItems.length && { isSortable: true }),
          },
          {
            name: '',
          },
        ];

    computedItems.map((item, index) => {
      const cost = this.getTotalCost(item, index);
      const label = item && item.label !== null ? item.label : '';
      const monthOverMonth = this.getMonthOverMonthCost(item, index);
      const isDisabled = label === `${noPrefix}${groupBy}` || label === `${noPrefix}${groupByTagKey}`;
      const desc = item.id && item.id !== item.label ? <div style={styles.infoDescription}>{item.id}</div> : null;
      const actions = this.getActions(item, isDisabled);

      const name = isDisabled ? (
        (label as any)
      ) : (
        <Link
          to={getBreakdownPath({
            basePath: formatPath(routes.ociDetailsBreakdown.path),
            description: item.id,
            groupBy,
            id: item.id,
            router,
            title: label.toString(),
          })}
        >
          {label}
        </Link>
      );

      rows.push({
        cells: [
          {}, // Empty cell for row selection
          {
            value: (
              <div>
                {name}
                {desc}
              </div>
            ),
          },
          { value: <div>{monthOverMonth}</div> },
          { value: <div>{cost}</div>, style: styles.managedColumn },
          { value: <div>{actions}</div> },
        ],
        isOpen: false,
        item,
        selected: isAllSelected || (selectedItems && selectedItems.find(val => val.id === item.id) !== undefined),
        selectionDisabled: isDisabled,
      });
    });

    this.setState({
      columns,
      rows,
    });
  };

  private getActions = (item: ComputedReportItem, isDisabled) => {
    const { groupBy, reportQueryString } = this.props;

    return (
      <Actions
        groupBy={groupBy}
        isDisabled={isDisabled}
        item={item}
        reportPathsType={reportPathsType}
        reportQueryString={reportQueryString}
      />
    );
  };

  private getMonthOverMonthCost = (item: ComputedReportItem, index: number) => {
    const { intl } = this.props;
    const value = formatCurrency(Math.abs(item.cost.total.value - item.delta_value), item.cost.total.units);
    const percentage = item.delta_percent !== null ? formatPercentage(Math.abs(item.delta_percent)) : 0;

    const showPercentage = !(percentage === 0 || percentage === '0.00');
    const showValue = item.delta_percent !== null; // Workaround for https://github.com/project-koku/koku/issues/1395

    let iconOverride;
    if (showPercentage) {
      iconOverride = 'iconOverride';
      if (item.delta_percent !== null && item.delta_value < 0) {
        iconOverride += ' decrease';
      }
      if (item.delta_percent !== null && item.delta_value > 0) {
        iconOverride += ' increase';
      }
    }

    if (!showValue) {
      return getNoDataForDateRangeString();
    } else {
      return (
        <div className="monthOverMonthOverride">
          <div className={iconOverride} key={`month-over-month-cost-${index}`}>
            {showPercentage ? intl.formatMessage(messages.percent, { value: percentage }) : <EmptyValueState />}
            {showPercentage && item.delta_percent !== null && item.delta_value > 0 && (
              <span className="fa fa-sort-up" style={styles.infoArrow} key={`month-over-month-icon-${index}`} />
            )}
            {showPercentage && item.delta_percent !== null && item.delta_value < 0 && (
              <span
                className="fa fa-sort-down"
                style={{
                  ...styles.infoArrow,
                  ...styles.infoArrowDesc,
                }}
                key={`month-over-month-icon-${index}`}
              />
            )}
          </div>
          <div style={styles.infoDescription} key={`month-over-month-info-${index}`}>
            {getForDateRangeString(value)}
          </div>
        </div>
      );
    }
  };

  private getTotalCost = (item: ComputedReportItem, index: number) => {
    const { report, intl } = this.props;
    const cost =
      report && report.meta && report.meta.total && report.meta.total.cost && report.meta.total.cost.total
        ? report.meta.total.cost.total.value
        : 0;
    const percentValue = cost === 0 ? cost.toFixed(2) : ((item.cost.total.value / cost) * 100).toFixed(2);

    return (
      <>
        {formatCurrency(item.cost.total.value, item.cost.total.units)}
        <div style={styles.infoDescription} key={`total-cost-${index}`}>
          {intl.formatMessage(messages.percentOfCost, { value: percentValue })}
        </div>
      </>
    );
  };

  public render() {
    const { isLoading, onSelected, onSort, selectedItems } = this.props;
    const { columns, rows } = this.state;

    return (
      <DataTable
        columns={columns}
        isLoading={isLoading}
        onSelected={onSelected}
        onSort={onSort}
        rows={rows}
        selectedItems={selectedItems}
      />
    );
  }
}

const DetailsTable = injectIntl(withRouter(DetailsTableBase));

export { DetailsTable };
export type { DetailsTableProps };
