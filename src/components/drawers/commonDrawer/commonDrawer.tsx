import './commonDrawer.scss';
import '@patternfly/patternfly/patternfly.css';

import { Drawer, DrawerContent, DrawerContentBody } from '@patternfly/react-core';
import { ExportsDrawer } from 'components/drawers';
import { OptimizationsDrawer } from 'components/drawers';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { createMapStateToProps } from 'store/common';
import { uiSelectors } from 'store/ui';

interface CommonDrawerOwnProps {
  children?: React.ReactNode;
}

interface CommonDrawerStateProps {
  isExportsDrawerOpen: boolean;
  isOptimizationsDrawerOpen: boolean;
}

interface CommonDrawerDispatchProps {
  // TBD...
}

type CommonDrawerProps = CommonDrawerOwnProps &
  CommonDrawerStateProps &
  CommonDrawerDispatchProps &
  WrappedComponentProps;

class CommonDrawerBase extends React.Component<CommonDrawerProps> {
  private drawerRef = React.createRef();

  private getPanelContent = () => {
    const { isExportsDrawerOpen, isOptimizationsDrawerOpen } = this.props;

    if (isExportsDrawerOpen) {
      return <ExportsDrawer />;
    } else if (isOptimizationsDrawerOpen) {
      return <OptimizationsDrawer />;
    }
    return null;
  };

  private handleExpand = () => {
    this.drawerRef.current && (this.drawerRef.current as any).focus();
  };

  public render() {
    const { children, isExportsDrawerOpen, isOptimizationsDrawerOpen } = this.props;

    const isExpanded = isExportsDrawerOpen || isOptimizationsDrawerOpen;

    // Sticky drawer is based on RHOSAK app, see:
    // https://github.com/redhat-developer/rhosak-ui/blob/main/apps/consoledot-rhosak/src/AppEntry.tsx#L30-L37
    // https://github.com/redhat-developer/rhosak-ui/blob/main/packages/ui/src/components/KafkaInstanceDrawer/KafkaInstanceDrawer.tsx#L69-L78
    return (
      <Drawer className="drawerOverride" isExpanded={isExpanded} onExpand={this.handleExpand}>
        <DrawerContent panelContent={this.getPanelContent()}>
          <DrawerContentBody className="pf-v5-u-display-flex pf-v5-u-flex-direction-column">
            {children}
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    );
  }
}

const mapStateToProps = createMapStateToProps<CommonDrawerOwnProps, CommonDrawerStateProps>(state => {
  return {
    isExportsDrawerOpen: uiSelectors.selectIsExportsDrawerOpen(state),
    isOptimizationsDrawerOpen: uiSelectors.selectIsOptimizationsDrawerOpen(state),
  };
});

const mapDispatchToProps: CommonDrawerDispatchProps = {
  // TBD...
};

const CommonDrawer = injectIntl(connect(mapStateToProps, mapDispatchToProps)(CommonDrawerBase));

export default CommonDrawer;
