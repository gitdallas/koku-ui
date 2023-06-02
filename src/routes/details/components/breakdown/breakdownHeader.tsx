import './breakdownHeader.scss';

import { Title, TitleSizes } from '@patternfly/react-core';
import { AngleLeftIcon } from '@patternfly/react-icons/dist/esm/icons/angle-left-icon';
import type { Query } from 'api/queries/query';
import { getQueryRoute, parseQuery } from 'api/queries/query';
import type { Report } from 'api/reports/report';
import type { TagPathsType } from 'api/tags/tag';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { routes } from 'routes';
import { ComputedReportItemValueType } from 'routes/components/charts/common';
import { CostDistribution } from 'routes/components/costDistribution';
import { CostType } from 'routes/components/costType';
import { Currency } from 'routes/components/currency';
import { TagLink } from 'routes/details/components/tag';
import { getGroupByCostCategory, getGroupByOrgValue, getGroupByTagKey } from 'routes/utils/groupBy';
import { createMapStateToProps } from 'store/common';
import { featureFlagsSelectors } from 'store/featureFlags';
import { getTotalCostDateRangeString } from 'utils/dates';
import { formatCurrency } from 'utils/format';
import { formatPath } from 'utils/paths';
import { awsCategoryKey, orgUnitIdKey, tagKey } from 'utils/props';
import type { RouterComponentProps } from 'utils/router';
import { withRouter } from 'utils/router';

import { styles } from './breakdownHeader.styles';

interface BreakdownHeaderOwnProps extends RouterComponentProps {
  costDistribution?: string;
  costType?: string;
  currency?: string;
  detailsURL?: string;
  description?: string;
  groupBy?: string;
  onCostDistributionSelected(value: string);
  onCostTypeSelected(value: string);
  onCurrencySelected(value: string);
  query: Query;
  report: Report;
  showCostDistribution?: boolean;
  showCostType?: boolean;
  tabs: React.ReactNode;
  tagPathsType: TagPathsType;
  title: string;
}

interface BreakdownHeaderStateProps {
  isCostDistributionFeatureEnabled?: boolean;
  isOptimizationsPath?: boolean;
}

interface BreakdownHeaderDispatchProps {
  // TBD...
}

type BreakdownHeaderProps = BreakdownHeaderOwnProps & BreakdownHeaderStateProps & WrappedComponentProps;

class BreakdownHeader extends React.Component<BreakdownHeaderProps, any> {
  private buildDetailsLink = url => {
    const { groupBy, isOptimizationsPath, query } = this.props;

    let groupByKey = groupBy;
    let value = '*';

    // Retrieve org unit used by the details page
    if (query[orgUnitIdKey]) {
      groupByKey = orgUnitIdKey;
      value = query[orgUnitIdKey];
    }

    const state = query.state ? window.atob(query.state) : undefined;
    const newQuery = {
      ...(state && JSON.parse(state)),
      ...(!isOptimizationsPath && {
        group_by: {
          [groupByKey]: value,
        },
      }),
    };
    return `${url}?${getQueryRoute(newQuery)}`;
  };

  private getBackToLink = groupByKey => {
    const { detailsURL, intl, isOptimizationsPath, tagPathsType } = this.props;

    if (isOptimizationsPath) {
      return (
        <Link to={this.buildDetailsLink(formatPath(routes.optimizations.path))}>
          {intl.formatMessage(messages.breakdownBackToOptimizations)}
        </Link>
      );
    }
    return (
      <Link to={this.buildDetailsLink(detailsURL)}>
        {intl.formatMessage(messages.breakdownBackToDetails, {
          value: intl.formatMessage(messages.breakdownBackToTitles, { value: tagPathsType }),
          groupBy: groupByKey,
        })}
      </Link>
    );
  };

  private getTotalCost = () => {
    const { costDistribution, report } = this.props;

    const reportItemValue = costDistribution ? costDistribution : ComputedReportItemValueType.total;
    const hasCost =
      report && report.meta && report.meta.total && report.meta.total.cost && report.meta.total.cost[reportItemValue];
    const cost = formatCurrency(
      hasCost ? report.meta.total.cost[reportItemValue].value : 0,
      hasCost ? report.meta.total.cost[reportItemValue].units : 'USD'
    );

    return cost;
  };

  public render() {
    const {
      costDistribution,
      costType,
      currency,
      description,
      groupBy,
      intl,
      isCostDistributionFeatureEnabled,
      onCostDistributionSelected,
      onCostTypeSelected,
      onCurrencySelected,
      query,
      showCostDistribution,
      showCostType,
      tabs,
      tagPathsType,
      title,
    } = this.props;

    const filterByAccount = query && query.filter ? query.filter.account : undefined;
    const groupByCostCategory = getGroupByCostCategory(query);
    const groupByOrg = getGroupByOrgValue(query);
    const groupByTag = getGroupByTagKey(query);
    const showTags =
      filterByAccount ||
      groupBy === 'account' ||
      groupBy === 'gcp_project' ||
      groupBy === 'payer_tenant_id' ||
      groupBy === 'project' ||
      groupBy === 'subscription_guid';

    // i18n groupBy key
    const groupByKey = filterByAccount
      ? 'account'
      : groupByCostCategory
      ? awsCategoryKey
      : groupByTag
      ? tagKey
      : groupByOrg
      ? orgUnitIdKey
      : groupBy;

    return (
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <nav aria-label={intl.formatMessage(messages.breakdownBackToDetailsAriaLabel)} className="breadcrumbOverride">
            <ol className="pf-v5-c-breadcrumb__list">
              <li className="pf-v5-c-breadcrumb__item">
                <span className="pf-v5-c-breadcrumb__item-divider">
                  <AngleLeftIcon />
                </span>
                {this.getBackToLink(groupByKey)}
              </li>
            </ol>
          </nav>
          <div style={styles.headerContentRight}>
            <Currency currency={currency} onSelect={onCurrencySelected} />
          </div>
        </div>
        <div style={styles.headerContent}>
          <div style={styles.title}>
            <Title headingLevel="h1" size={TitleSizes['2xl']}>
              {intl.formatMessage(messages.breakdownTitle, { value: title })}
              {description && <div style={styles.infoDescription}>{description}</div>}
            </Title>
            {showCostDistribution && isCostDistributionFeatureEnabled && (
              <div style={styles.costDistribution}>
                <CostDistribution costDistribution={costDistribution} onSelect={onCostDistributionSelected} />
              </div>
            )}
            {showCostType && (
              <div style={styles.costType}>
                <CostType onSelect={onCostTypeSelected} costType={costType} />
              </div>
            )}
          </div>
          <div style={styles.cost}>
            <div style={styles.costLabel}>
              <Title headingLevel="h2" style={styles.costValue} size={TitleSizes['4xl']}>
                <span>{this.getTotalCost()}</span>
              </Title>
            </div>
            <div style={styles.costLabelDate}>
              {getTotalCostDateRangeString(
                intl.formatMessage(messages.groupByValuesTitleCase, { value: groupByKey, count: 2 })
              )}
            </div>
          </div>
        </div>
        <div>
          <div style={styles.tabs}>
            {tabs}
            <div style={styles.tag}>{showTags && <TagLink id="tags" tagPathsType={tagPathsType} />}</div>
          </div>
        </div>
      </header>
    );
  }
}

const mapStateToProps = createMapStateToProps<BreakdownHeaderOwnProps, BreakdownHeaderStateProps>(
  (state, { router }) => {
    const queryFromRoute = parseQuery<Query>(router.location.search);

    return {
      isCostDistributionFeatureEnabled: featureFlagsSelectors.selectIsCostDistributionFeatureEnabled(state),
      isOptimizationsPath: queryFromRoute.optimizationsPath !== undefined,
    };
  }
);

const mapDispatchToProps: BreakdownHeaderDispatchProps = {
  // TDB
};

export default injectIntl(withRouter(connect(mapStateToProps, mapDispatchToProps)(BreakdownHeader)));
