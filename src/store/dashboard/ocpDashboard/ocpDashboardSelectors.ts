import type { RootState } from 'store/rootReducer';
import { getCurrency } from 'utils/localStorage';

import {
  getQueryForWidget,
  getQueryForWidgetTabs,
  ocpDashboardDefaultFilters,
  ocpDashboardStateKey,
  ocpDashboardTabFilters,
} from './ocpDashboardCommon';

export const selectOcpDashboardState = (state: RootState) => state[ocpDashboardStateKey];

export const selectWidgets = (state: RootState) => selectOcpDashboardState(state).widgets;

export const selectWidget = (state: RootState, id: number) => selectWidgets(state)[id];

export const selectCurrentWidgets = (state: RootState) => selectOcpDashboardState(state).currentWidgets;

export const selectWidgetQueries = (state: RootState, id: number) => {
  const widget = selectWidget(state, id);

  const defaultFilter = {
    ...ocpDashboardDefaultFilters,
    ...(widget.filter ? widget.filter : {}),
  };
  const tabsFilter = {
    ...ocpDashboardTabFilters,
    ...(widget.tabsFilter ? widget.tabsFilter : {}),
  };
  const props = {
    currency: getCurrency(),
  };

  return {
    previous: getQueryForWidget(
      {
        ...defaultFilter,
        time_scope_value: -2,
      },
      props
    ),
    current: getQueryForWidget(defaultFilter, props),
    forecast: getQueryForWidget({}, { limit: 31, ...props }),
    optimizations: getQueryForWidget({}),
    tabs: getQueryForWidgetTabs(
      widget,
      {
        ...(tabsFilter as any),
        resolution: 'monthly',
      },
      props
    ),
  };
};
