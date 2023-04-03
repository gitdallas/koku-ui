import { EmptyState, EmptyStateBody, EmptyStateVariant, Spinner, Title, EmptyStateHeader, EmptyStateFooter } from '@patternfly/react-core';
import { intl as defaultIntl } from 'components/i18n';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';

interface LoadingStateProps extends WrappedComponentProps {
  icon?: string;
}

// defaultIntl required for testing
const LoadingStateBase: React.FC<LoadingStateProps> = ({ intl = defaultIntl }) => {
  const title = intl.formatMessage(messages.loadingStateTitle);
  const subTitle = intl.formatMessage(messages.loadingStateDesc);

  return (
    <EmptyState variant={EmptyStateVariant.lg} className="pf-m-redhat-font">
      <EmptyStateHeader titleText={<>{title}</>} headingLevel="h5" /><Spinner size="lg" />
      
      <EmptyStateBody>{subTitle}</EmptyStateBody>
    </EmptyState>
  );
};

const LoadingState = injectIntl(LoadingStateBase);

export default LoadingState;
