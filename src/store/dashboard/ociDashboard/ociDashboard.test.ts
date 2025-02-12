jest.mock('store/reports/reportActions');

import { ReportType } from 'api/reports/report';
import { DatumType } from 'routes/views/components/charts/common/chartDatum';
import { createMockStoreCreator } from 'store/mockStore';
import { reportActions } from 'store/reports';

import * as actions from './ociDashboardActions';
import { getGroupByForTab, getQueryForWidgetTabs, ociDashboardStateKey, OciDashboardTab } from './ociDashboardCommon';
import { ociDashboardReducer } from './ociDashboardReducer';
import * as selectors from './ociDashboardSelectors';
import {
  costSummaryWidget,
  databaseWidget,
  networkWidget,
  storageWidget,
  virtualMachineWidget,
} from './ociDashboardWidgets';

const createOciDashboardStore = createMockStoreCreator({
  [ociDashboardStateKey]: ociDashboardReducer,
});

const fetchReportMock = reportActions.fetchReport as jest.Mock;

beforeEach(() => {
  fetchReportMock.mockReturnValue({ type: '@@test' });
});

test('default state', () => {
  const store = createOciDashboardStore();
  const state = store.getState();
  expect(selectors.selectCurrentWidgets(state)).toEqual([
    costSummaryWidget.id,
    virtualMachineWidget.id,
    storageWidget.id,
    networkWidget.id,
    databaseWidget.id,
  ]);
  expect(selectors.selectWidget(state, costSummaryWidget.id)).toEqual(costSummaryWidget);
});

test('fetch widget reports', () => {
  const store = createOciDashboardStore();
  store.dispatch(actions.fetchWidgetReports(costSummaryWidget.id));
  expect(fetchReportMock.mock.calls).toMatchSnapshot();
});

test('changeWidgetTab', () => {
  const store = createOciDashboardStore();
  store.dispatch(actions.changeWidgetTab(costSummaryWidget.id, OciDashboardTab.regions));
  const widget = selectors.selectWidget(store.getState(), costSummaryWidget.id);
  expect(widget.currentTab).toBe(OciDashboardTab.regions);
  expect(fetchReportMock).toHaveBeenCalledTimes(3);
});

describe('getGroupByForTab', () => {
  test('services tab', () => {
    const widget = getGroupByForTab({
      currentTab: OciDashboardTab.product_services,
    });
    expect(widget).toMatchSnapshot();
  });

  test('accounts tab', () => {
    const widget = getGroupByForTab({
      currentTab: OciDashboardTab.payer_tenant_ids,
    });
    expect(widget).toMatchSnapshot();
  });

  test('regions tab', () => {
    const widget = getGroupByForTab({
      currentTab: OciDashboardTab.regions,
    });
    expect(widget).toMatchSnapshot();
  });

  test('unknown tab', () => {
    expect(getGroupByForTab('unknown' as any)).toMatchSnapshot();
  });
});

test('getQueryForWidget', () => {
  const widget = {
    id: 1,
    titleKey: '',
    reportType: ReportType.cost,
    availableTabs: [OciDashboardTab.payer_tenant_ids],
    currentTab: OciDashboardTab.payer_tenant_ids,
    details: { formatOptions: {} },
    trend: {
      datumType: DatumType.rolling,
      formatOptions: {},
      titleKey: '',
    },
    topItems: {
      formatOptions: {},
    },
  };

  [
    [
      undefined,
      'filter[resolution]=daily&filter[time_scope_units]=month&filter[time_scope_value]=-1&group_by[payer_tenant_id]=*',
    ],
    [{}, 'group_by[payer_tenant_id]=*'],
    [{ limit: 3 }, 'filter[limit]=3&group_by[payer_tenant_id]=*'],
  ].forEach(value => {
    expect(getQueryForWidgetTabs(widget, value[0])).toEqual(value[1]);
  });
});
