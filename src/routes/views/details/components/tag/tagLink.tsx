import { TagIcon } from '@patternfly/react-icons/dist/esm/icons/tag-icon';
import type { Query } from 'api/queries/query';
import { getQuery, logicalAndPrefix, orgUnitIdKey, parseQuery, tagPrefix } from 'api/queries/query';
import type { Tag, TagPathsType } from 'api/tags/tag';
import { TagType } from 'api/tags/tag';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { getGroupById, getGroupByOrgValue, getGroupByValue } from 'routes/views/utils/groupBy';
import type { FetchStatus } from 'store/common';
import { createMapStateToProps } from 'store/common';
import { tagActions, tagSelectors } from 'store/tags';

import { styles } from './tag.styles';
import { TagModal } from './tagModal';

interface TagLinkOwnProps {
  id?: string;
  tagReportPathsType: TagPathsType;
}

interface TagLinkState {
  isOpen: boolean;
}

interface TagLinkStateProps {
  groupBy: string;
  groupByValue: string | number;
  query?: Query;
  tagReport?: Tag;
  tagReportFetchStatus?: FetchStatus;
  tagQueryString?: string;
}

interface TagLinkDispatchProps {
  fetchTag?: typeof tagActions.fetchTag;
}

type TagLinkProps = TagLinkOwnProps & TagLinkStateProps & TagLinkDispatchProps & WrappedComponentProps;

const tagReportType = TagType.tag;

class TagLinkBase extends React.Component<TagLinkProps> {
  protected defaultState: TagLinkState = {
    isOpen: false,
  };
  public state: TagLinkState = { ...this.defaultState };

  constructor(props: TagLinkProps) {
    super(props);
    this.handleClose = this.handleClose.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
  }

  public componentDidMount() {
    const { fetchTag, tagReportPathsType, tagQueryString } = this.props;
    fetchTag(tagReportPathsType, tagReportType, tagQueryString);
  }

  public componentDidUpdate(prevProps: TagLinkProps) {
    const { fetchTag, tagReportPathsType, tagQueryString } = this.props;
    if (prevProps.tagQueryString !== tagQueryString) {
      fetchTag(tagReportPathsType, tagReportType, tagQueryString);
    }
  }

  public handleClose = (isOpen: boolean) => {
    this.setState({ isOpen });
  };

  public handleOpen = event => {
    this.setState({ isOpen: true });
    event.preventDefault();
    return false;
  };

  public render() {
    const { id, tagReport, tagReportPathsType } = this.props;
    const { isOpen } = this.state;

    let count = 0;

    if (tagReport) {
      for (const item of tagReport.data) {
        if (item.values) {
          count += item.values.length;
        }
      }
    }

    return (
      <div style={styles.tagsContainer} id={id}>
        {Boolean(count > 0) && (
          <>
            <TagIcon />
            <a data-testid="tag-lnk" href="#/" onClick={this.handleOpen} style={styles.tagLink}>
              {count}
            </a>
          </>
        )}
        <TagModal isOpen={isOpen} onClose={this.handleClose} tagReportPathsType={tagReportPathsType} />
      </div>
    );
  }
}

const mapStateToProps = createMapStateToProps<TagLinkOwnProps, TagLinkStateProps>((state, { tagReportPathsType }) => {
  const query = parseQuery<Query>(location.search);
  const groupByOrgValue = getGroupByOrgValue(query);
  const groupBy = groupByOrgValue ? orgUnitIdKey : getGroupById(query);
  const groupByValue = groupByOrgValue ? groupByOrgValue : getGroupByValue(query);

  // Prune unsupported tag params from filter_by
  const filterByParams = query && query.filter_by ? query.filter_by : {};
  for (const key of Object.keys(filterByParams)) {
    if (key.indexOf(tagPrefix) !== -1) {
      filterByParams[key] = undefined;
    }
  }

  const newQuery: Query = {
    filter: {
      resolution: 'monthly',
      time_scope_units: 'month',
      time_scope_value: -1,
    },
    filter_by: {
      // Add filters here to apply logical OR/AND
      ...filterByParams,
      ...(query && query.filter && query.filter.account && { [`${logicalAndPrefix}account`]: query.filter.account }),
      ...(groupBy && groupBy.indexOf(tagPrefix) === -1 && { [groupBy]: groupByValue }), // Note: Cannot use group_by with tags
    },
  };
  const tagQueryString = getQuery(newQuery);
  const tagReport = tagSelectors.selectTag(state, tagReportPathsType, tagReportType, tagQueryString);
  const tagReportFetchStatus = tagSelectors.selectTagFetchStatus(
    state,
    tagReportPathsType,
    tagReportType,
    tagQueryString
  );

  return {
    groupBy,
    groupByValue,
    query,
    tagReport,
    tagReportFetchStatus,
    tagQueryString,
  };
});

const mapDispatchToProps: TagLinkDispatchProps = {
  fetchTag: tagActions.fetchTag,
};

const TagLink = injectIntl(connect(mapStateToProps, mapDispatchToProps)(TagLinkBase));

export default TagLink;
