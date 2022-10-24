import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import type { DashboardWidgetOwnProps, DashboardWidgetStateProps } from 'routes/views/overview/components';
import { DashboardWidgetBase } from 'routes/views/overview/components';
import { createMapStateToProps } from 'store/common';
import { gcpOcpDashboardActions, gcpOcpDashboardSelectors, GcpOcpDashboardTab } from 'store/dashboard/gcpOcpDashboard';
import { featureFlagsSelectors } from 'store/featureFlags';
import { forecastSelectors } from 'store/forecasts';
import { reportSelectors } from 'store/reports';
import type { ComputedGcpReportItemsParams } from 'utils/computedReport/getComputedGcpReportItems';
import { getCurrency } from 'utils/currency';

interface GcpOcpDashboardWidgetDispatchProps {
  fetchForecasts: typeof gcpOcpDashboardActions.fetchWidgetForecasts;
  fetchReports: typeof gcpOcpDashboardActions.fetchWidgetReports;
  updateTab: typeof gcpOcpDashboardActions.changeWidgetTab;
}

export const getIdKeyForTab = (tab: GcpOcpDashboardTab): ComputedGcpReportItemsParams['idKey'] => {
  switch (tab) {
    case GcpOcpDashboardTab.gcpProjects:
      return 'gcp_project';
    case GcpOcpDashboardTab.regions:
      return 'region';
    case GcpOcpDashboardTab.services:
      return 'service';
  }
};

const mapStateToProps = createMapStateToProps<DashboardWidgetOwnProps, DashboardWidgetStateProps>(
  (state, { widgetId }) => {
    const widget = gcpOcpDashboardSelectors.selectWidget(state, widgetId);
    const queries = gcpOcpDashboardSelectors.selectWidgetQueries(state, widgetId);
    return {
      ...widget,
      ...(featureFlagsSelectors.selectIsCurrencyFeatureEnabled(state) && { currency: getCurrency() }),
      getIdKeyForTab,
      currentQuery: queries.current,
      previousQuery: queries.previous,
      tabsQuery: queries.tabs,
      currentReport: reportSelectors.selectReport(state, widget.reportPathsType, widget.reportType, queries.current),
      currentReportFetchStatus: reportSelectors.selectReportFetchStatus(
        state,
        widget.reportPathsType,
        widget.reportType,
        queries.current
      ),
      forecast: forecastSelectors.selectForecast(
        state,
        widget.forecastPathsType,
        widget.forecastType,
        queries.forecast
      ),
      previousReport: reportSelectors.selectReport(state, widget.reportPathsType, widget.reportType, queries.previous),
      tabsReport: reportSelectors.selectReport(state, widget.reportPathsType, widget.reportType, queries.tabs),
      tabsReportFetchStatus: reportSelectors.selectReportFetchStatus(
        state,
        widget.reportPathsType,
        widget.reportType,
        queries.tabs
      ),
    };
  }
);

const mapDispatchToProps: GcpOcpDashboardWidgetDispatchProps = {
  fetchForecasts: gcpOcpDashboardActions.fetchWidgetForecasts,
  fetchReports: gcpOcpDashboardActions.fetchWidgetReports,
  updateTab: gcpOcpDashboardActions.changeWidgetTab,
};

const GcpOcpDashboardWidget = injectIntl(connect(mapStateToProps, mapDispatchToProps)(DashboardWidgetBase));

export { GcpOcpDashboardWidget };
