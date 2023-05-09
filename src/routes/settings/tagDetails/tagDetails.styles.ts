import global_BackgroundColor_light_100 from '@patternfly/react-tokens/dist/js/global_BackgroundColor_light_100';
import global_spacer_lg from '@patternfly/react-tokens/dist/js/global_spacer_lg';
import global_spacer_md from '@patternfly/react-tokens/dist/js/global_spacer_md';
import type React from 'react';

export const styles = {
  content: {
    paddingBottom: global_spacer_lg.value,
    paddingTop: global_spacer_lg.value,
  },
  paginationContainer: {
    marginLeft: global_spacer_lg.value,
    marginRight: global_spacer_lg.value,
  },
  pagination: {
    backgroundColor: global_BackgroundColor_light_100.value,
    paddingBottom: global_spacer_md.value,
    paddingTop: global_spacer_md.value,
  },
  tableContainer: {
    marginLeft: global_spacer_lg.value,
    marginRight: global_spacer_lg.value,
  },
  tagDetails: {
    minHeight: '100vh',
  },
  toolbarContainer: {
    marginLeft: global_spacer_lg.value,
    marginRight: global_spacer_lg.value,
  },
} as { [className: string]: React.CSSProperties };
