import 'routes/views/details/components/dataTable/dataTable.scss';

import { Label } from '@patternfly/react-core';
import type { Report, ReportItem } from 'api/reports/report';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { DataTable } from 'routes/views/details/components/dataTable';
import type { ComputedReportItem } from 'utils/computedReport/getComputedReportItems';
import { getUnsortedComputedReportItems } from 'utils/computedReport/getComputedReportItems';
import type { RouterComponentProps } from 'utils/router';
import { withRouter } from 'utils/router';

interface DetailsTableOwnProps extends RouterComponentProps, WrappedComponentProps {
  isAllSelected?: boolean;
  isLoading?: boolean;
  onSelected(items: ComputedReportItem[], isSelected: boolean);
  onSort(value: string, isSortAscending: boolean);
  report: Report;
  reportQueryString: string;
  selectedItems?: ComputedReportItem[];
}

interface DetailsTableState {
  columns?: any[];
  rows?: any[];
}

type DetailsTableProps = DetailsTableOwnProps;

export const DetailsTableColumnIds = {
  infrastructure: 'infrastructure',
  monthOverMonth: 'monthOverMonth',
  supplementary: 'supplementary',
};

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
    const { intl, isAllSelected, report, selectedItems } = this.props;
    if (!report) {
      return;
    }

    const rows = [];
    const computedItems = getUnsortedComputedReportItems<Report, ReportItem>({
      report,
      idKey: 'project' as any,
    });

    const columns = [
      {
        name: '', // Selection column
      },
      {
        orderBy: 'name',
        name: intl.formatMessage(messages.detailsResourceNames, { value: 'name' }),
        ...(computedItems.length && { isSortable: true }),
      },
      {
        orderBy: 'status',
        name: intl.formatMessage(messages.detailsResourceNames, { value: 'status' }),
        ...(computedItems.length && { isSortable: true }),
      },
      {
        orderBy: 'source_type',
        name: intl.formatMessage(messages.sourceType),
        ...(computedItems.length && { isSortable: true }),
      },
    ];

    computedItems.map((item, index) => {
      const label = item && item.label !== null ? item.label : '';

      rows.push({
        cells: [
          {}, // Empty cell for row selection
          {
            value: label,
          },
          {
            value: (
              <Label variant="outline" color="green">
                {intl.formatMessage(messages.enabled)}
              </Label>
            ),
          },
          { value: 'source type' },
        ],
        item,
        selected: isAllSelected || (selectedItems && selectedItems.find(val => val.id === item.id) !== undefined),
      });
    });

    const filteredColumns = (columns as any[]).filter(column => !column.hidden);
    const filteredRows = rows.map(({ ...row }) => {
      row.cells = row.cells.filter(cell => !cell.hidden);
      return row;
    });

    this.setState({
      columns: filteredColumns,
      rows: filteredRows,
    });
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

const TagTable = injectIntl(withRouter(DetailsTableBase));

export { TagTable };
export type { DetailsTableProps };
