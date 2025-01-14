import type { Report, ReportData, ReportItem, ReportItemValue, ReportValue } from 'api/reports/report';
import { intl } from 'components/i18n';
import messages from 'locales/messages';
import { sort, SortDirection } from 'utils/sort';

import { getItemLabel } from './getItemLabel';

export interface ComputedReportValue {
  units?: string;
  value?: number | string;
}

export interface ComputedReportItemValue {
  distributed?: ReportValue;
  markup?: ReportValue;
  platformDistributed?: ReportValue;
  raw?: ReportValue;
  total?: ReportValue;
  usage?: ReportValue;
  workerUnallocatedDistributed?: ReportValue;
}

export interface ComputedReportOcpItem extends ReportItem {
  capacity?: ReportValue;
  cluster?: string;
  clusters?: string[];
  limit?: ReportValue;
  request?: ReportValue;
  usage?: ReportValue;
}

export interface ComputedReportOrgItem extends ReportItem {
  id?: string;
}

export interface ComputedReportItem extends ComputedReportOcpItem, ComputedReportOrgItem {
  cost?: ReportItemValue;
  date?: string;
  delta_percent?: number;
  delta_value?: number;
  infrastructure?: ReportItemValue;
  label?: string; // helper for item label
  source_uuid?: string;
  supplementary?: ReportItemValue;
  type?: string; // 'account' or 'organizational_unit'
}

export interface ComputedReportItemsParams<R extends Report, T extends ReportItem> {
  idKey: keyof T;
  isDateMap?: boolean;
  report: R;
  sortKey?: keyof ComputedReportItem;
  sortDirection?: SortDirection;
}

export function getComputedReportItems<R extends Report, T extends ReportItem>({
  idKey,
  isDateMap,
  report,
  sortDirection = SortDirection.asc,
  sortKey = 'date',
}: ComputedReportItemsParams<R, T>) {
  return sort(
    getUnsortedComputedReportItems<R, T>({
      idKey,
      isDateMap,
      report,
      sortDirection,
      sortKey,
    }),
    {
      key: sortKey,
      direction: sortDirection,
    }
  );
}

// For filter[categpry]=platform, all clusters are listed in the breakdown page
function getClusters(val, item?: any) {
  const clusters = val.clusters ? val.clusters : [];
  if (item && item.clusters) {
    item.clusters.forEach(cluster => {
      if (!clusters.includes(cluster)) {
        clusters.push(cluster);
      }
    });
  }
  return clusters.sort((a, b) => {
    if (a < b) {
      return -1;
    }
    if (a > b) {
      return 1;
    }
    return 0;
  });
}

function getCostData(val, key, item?: any) {
  return {
    distributed: {
      value:
        (item && item[key] && item[key].distributed ? item[key].distributed.value : 0) +
        (val[key] && val[key].distributed ? val[key].distributed.value : 0),
      units: val && val[key] && val[key].distributed ? val[key].distributed.units : 'USD',
    },
    markup: {
      value:
        (item && item[key] && item[key].markup ? item[key].markup.value : 0) +
        (val[key] && val[key].markup ? val[key].markup.value : 0),
      units: val && val[key] && val[key].markup ? val[key].markup.units : 'USD',
    },
    platformDistributed: {
      value:
        (item && item[key] && item[key].platform_distributed ? item[key].platform_distributed.value : 0) +
        (val[key] && val[key].platform_distributed ? val[key].platform_distributed.value : 0),
      units: val && val[key] && val[key].platform_distributed ? val[key].platform_distributed.units : 'USD',
    },
    raw: {
      value:
        (item && item[key] && item[key].raw ? item[key].raw.value : 0) +
        (val[key] && val[key].raw ? val[key].raw.value : 0),
      units: val && val[key] && val[key].raw ? val[key].raw.units : 'USD',
    },
    total: {
      value:
        (item && item[key] && item[key].total ? item[key].total.value : 0) +
        (val[key] && val[key].total ? Number(val[key].total.value) : 0),
      units: val && val[key] && val[key].total ? val[key].total.units : null,
    },
    usage: {
      value:
        (item && item[key] && item[key].usage ? item[key].usage.value : 0) +
        (val[key] && val[key].usage ? Number(val[key].usage.value) : 0),
      units: val && val[key] && val[key].usage ? val[key].usage.units : null,
    },
    workerUnallocatedDistributed: {
      value:
        (item && item[key] && item[key].worker_unallocated_distributed
          ? item[key].worker_unallocated_distributed.value
          : 0) +
        (val[key] && val[key].worker_unallocated_distributed
          ? Number(val[key].worker_unallocated_distributed.value)
          : 0),
      units:
        val && val[key] && val[key].worker_unallocated_distributed
          ? val[key].worker_unallocated_distributed.units
          : null,
    },
  };
}

function getUsageData(val, item?: any) {
  return {
    capacity: {
      value: (item && item.capacity ? item.capacity.value : 0) + (val.capacity ? val.capacity.value : 0),
      units: val && val.capacity ? val.capacity.units : 'Core-Hours',
    },
    limit: {
      value: (item && item.limit ? item.limit.value : 0) + (val.limit ? val.limit.value : 0),
      units: val && val.limit ? val.limit.units : 'Core-Hours',
    },
    request: {
      value: (item && item.request ? item.request.value : 0) + (val.request ? val.request.value : 0),
      units: val && val.request ? val.request.units : 'Core-Hours',
    },
    usage: {
      value: (item && item.usage ? item.usage.value : 0) + (val.usage ? val.usage.value : 0),
      units: val && val.usage ? val.usage.units : 'Core-Hours',
    },
  };
}

// Details pages typically use this function with filter[resolution]=monthly
export function getUnsortedComputedReportItems<R extends Report, T extends ReportItem>({
  isDateMap = false,
  report,
  idKey, // Note: The idKey must use org_entities for reports, while group_by uses org_unit_id
}: ComputedReportItemsParams<R, T>) {
  if (!report) {
    return [];
  }

  // Map<string | number, ComputedReportItem | Map<string | number, ComputedReportItem>
  const itemMap = new Map();

  const visitDataPoint = (dataPoint: ReportData) => {
    const type = dataPoint.type; // Org unit type

    if (dataPoint && dataPoint.values) {
      dataPoint.values.forEach((val: any) => {
        let id = val.id ? val.id : val[idKey];
        if (!id) {
          id = val.date;
        }

        // Ensure unique map IDs -- https://github.com/project-koku/koku-ui/issues/706
        const idSuffix = idKey !== 'date' && idKey !== 'cluster' && val.cluster ? `-${val.cluster}` : '';
        const mapId = `${id}${idSuffix}`;

        // 'clusters' will contain either the cluster alias or default cluster ID
        const classification = val.classification;
        const cluster_alias = val.clusters && val.clusters.length > 0 ? val.clusters[0] : undefined;
        const cluster = cluster_alias || val.cluster;
        const date = val.date;
        const default_project = val.default_project && val.default_project.toLowerCase() === 'true';
        const delta_percent = val.delta_percent ? val.delta_percent : 0;
        const delta_value = val.delta_value ? val.delta_value : 0;
        const source_uuid = val.source_uuid ? val.source_uuid : [];

        let label;
        if (report.meta && report.meta.others && (id === 'Other' || id === 'Others')) {
          // Add count to "Others" label
          label = intl.formatMessage(messages.chartOthers, { count: report.meta.others });
        } else {
          const itemLabelKey = getItemLabel({ report, idKey, value: val });
          if (itemLabelKey === 'org_entities' && val.alias) {
            label = val.alias;
          } else if (itemLabelKey === 'account' && val.account_alias) {
            label = val.account_alias;
          } else if (itemLabelKey === 'cluster' && cluster_alias) {
            label = cluster_alias;
          } else if (val[itemLabelKey] instanceof Object) {
            label = val[itemLabelKey].value;
          } else {
            label = val[itemLabelKey];
          }
          if (label === undefined || label.trim().length === 0) {
            label = val.alias && val.alias.trim().length > 0 ? val.alias : val[idKey];
          }
        }

        if (isDateMap) {
          const data = {
            ...getUsageData(val), // capacity, limit, request, & usage
            classification,
            cluster,
            clusters: getClusters(val),
            cost: getCostData(val, 'cost'),
            date,
            default_project,
            delta_percent,
            delta_value,
            id,
            infrastructure: getCostData(val, 'infrastructure'),
            label,
            source_uuid,
            supplementary: getCostData(val, 'supplementary'),
            type,
          };
          const item = itemMap.get(mapId);
          if (item) {
            item.set(date, data);
          } else {
            const dateMap = new Map();
            dateMap.set(date, data);
            itemMap.set(mapId, dateMap);
          }
        } else {
          const item = itemMap.get(mapId);
          if (item) {
            // When applying multiple group_by params, costs may be split between regions. We need to sum those costs
            // See https://issues.redhat.com/browse/COST-1131
            itemMap.set(mapId, {
              ...item,
              ...getUsageData(val, item), // capacity, limit, request, & usage
              classification,
              cluster,
              clusters: getClusters(val, item),
              cost: getCostData(val, 'cost', item),
              date,
              default_project,
              delta_percent,
              delta_value,
              id,
              infrastructure: getCostData(val, 'infrastructure', item),
              label,
              source_uuid,
              supplementary: getCostData(val, 'supplementary', item),
              type,
            });
          } else {
            itemMap.set(mapId, {
              ...getUsageData(val), // capacity, limit, request, & usage
              classification,
              cluster,
              clusters: getClusters(val),
              cost: getCostData(val, 'cost'),
              date,
              default_project,
              delta_percent,
              delta_value,
              id,
              infrastructure: getCostData(val, 'infrastructure'),
              label,
              source_uuid,
              supplementary: getCostData(val, 'supplementary'),
              type,
            });
          }
        }
      });
    }
    for (const key in dataPoint) {
      if (dataPoint[key] instanceof Array) {
        return dataPoint[key].forEach(visitDataPoint);
      }
    }
  };
  if (report && report.data) {
    report.data.forEach(visitDataPoint);
  }
  return Array.from(itemMap.values());
}
