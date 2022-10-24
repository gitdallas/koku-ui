import type { IActions, ISortBy } from '@patternfly/react-table';
import {
  compoundExpand,
  sortable,
  SortByDirection,
  Table,
  TableBody,
  TableHeader,
  TableVariant,
} from '@patternfly/react-table';
import type { Rate } from 'api/rates';
import { intl as defaultIntl } from 'components/i18n';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { formatCurrencyRate, unitsLookupKey } from 'utils/format';

import TagRateTable from './tagRateTable';

interface RateTableProps extends WrappedComponentProps {
  actions?: IActions;
  isCompact?: boolean;
  tiers: Rate[];
  sortCallback?: ({ index, direction }) => void;
}

// defaultIntl required for testing
const RateTableBase: React.FC<RateTableProps> = ({
  actions,
  intl = defaultIntl,
  isCompact,
  tiers,
  sortCallback = () => {},
}) => {
  const [expanded, setExpanded] = React.useState({});
  const [sortBy, setSortBy] = React.useState<ISortBy>({});
  const getMetric = value => intl.formatMessage(messages.metricValues, { value }) || value;
  const getMeasurement = (measurement, units) => {
    units = intl.formatMessage(messages.units, { units: unitsLookupKey(units) }) || units;
    return intl.formatMessage(messages.measurementValues, {
      value: measurement.toLowerCase().replace('-', '_'),
      units,
      count: 2,
    });
  };
  const onSort = (_event, index: number, direction: SortByDirection) => {
    setSortBy({ index, direction });
    sortCallback({ index, direction });
  };
  let counter = 0;
  const rows = tiers.reduce((acc, tier, ix) => {
    const rateKind = tier.tiered_rates ? 'regular' : 'tagging';
    let compoundRows = [];
    if (rateKind === 'tagging') {
      compoundRows = [
        {
          compoundParent: 4,
          parent: ix + counter,
          cells: [
            {
              title: <TagRateTable tagRates={tier.tag_rates} />,
              props: { colSpan: 6, className: 'pf-m-no-padding' },
            },
          ],
        },
      ];
      counter += 1;
    }
    const isOpen = rateKind === 'tagging' ? expanded[ix + counter - 1] || false : undefined;
    const tierRate = tier.tiered_rates ? tier.tiered_rates[0].value : 0;
    return [
      ...acc,
      {
        data: { index: ix, hasChildren: rateKind === 'tagging' },
        cells: [
          tier.description || '',
          getMetric(tier.metric.label_metric),
          getMeasurement(tier.metric.label_measurement, tier.metric.label_measurement_unit),
          tier.cost_type,
          {
            title:
              rateKind === 'regular'
                ? formatCurrencyRate(tierRate, tier.tiered_rates[0].unit)
                : intl.formatMessage(messages.various),
            props: { isOpen, style: { padding: rateKind === 'tagging' ? '' : '1.5rem 1rem' } },
          },
        ],
      },
      ...compoundRows,
    ];
  }, []);
  const cells = [
    { title: intl.formatMessage(messages.description) },
    { title: intl.formatMessage(messages.metric), ...(rows.length && { transforms: [sortable] }) },
    { title: intl.formatMessage(messages.measurement), ...(rows.length && { transforms: [sortable] }) },
    { title: intl.formatMessage(messages.calculationType) },
    { title: intl.formatMessage(messages.rate), cellTransforms: [compoundExpand] },
  ];
  const onExpand = (_event: any, rowIndex: number, _colIndex: number, isOpen: boolean) => {
    setExpanded({ ...expanded, [rowIndex]: !isOpen });
  };
  const actionResolver = rowData => {
    if (rowData.compoundParent) {
      return [];
    }
    return actions;
  };
  return (
    <Table
      onSort={onSort}
      sortBy={sortBy}
      aria-label={intl.formatMessage(messages.costModelsWizardCreatePriceList)}
      variant={isCompact ? TableVariant.compact : undefined}
      rows={rows}
      cells={cells}
      actionResolver={actionResolver}
      onExpand={onExpand}
    >
      <TableHeader />
      <TableBody />
    </Table>
  );
};

const RateTable = injectIntl(RateTableBase);
export { RateTable };
