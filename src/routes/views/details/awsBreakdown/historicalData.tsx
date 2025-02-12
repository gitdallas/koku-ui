import { connect } from 'react-redux';
import type { HistoricalDataStateProps } from 'routes/views/details/components/historicalData';
import { HistoricalDataBase } from 'routes/views/details/components/historicalData';
import { awsHistoricalDataSelectors } from 'store/breakdown/historicalData/awsHistoricalData';
import { createMapStateToProps } from 'store/common';

interface AwsHistoricalDataOwnProps {
  // TBD...
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mapStateToProps = createMapStateToProps<AwsHistoricalDataOwnProps, HistoricalDataStateProps>((state, props) => {
  return {
    selectWidgets: awsHistoricalDataSelectors.selectWidgets(state),
    widgets: awsHistoricalDataSelectors.selectCurrentWidgets(state),
  };
});

const HistoricalData = connect(mapStateToProps, {})(HistoricalDataBase);

export { HistoricalData };
