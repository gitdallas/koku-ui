import type { SelectOptionObject, ToolbarChipGroup } from '@patternfly/react-core';
import {
  Button,
  ButtonVariant,
  InputGroup,
  Select,
  SelectOption,
  SelectVariant,
  TextInput,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import type { Query } from 'api/queries/query';
import { getQuery, orgUnitIdKey, parseQuery } from 'api/queries/query';
import type { Tag } from 'api/tags/tag';
import { TagPathsType, TagType } from 'api/tags/tag';
import { intl } from 'components/i18n';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { getGroupById, getGroupByOrgValue, getGroupByValue } from 'routes/views/utils/groupBy';
import { createMapStateToProps, FetchStatus } from 'store/common';
import { tagActions, tagSelectors } from 'store/tags';

interface TagValueOwnProps extends WrappedComponentProps {
  isDisabled?: boolean;
  onTagValueSelect(event, selection);
  onTagValueInput(event);
  onTagValueInputChange(value: string);
  selections?: SelectOptionObject[];
  tagKey: string;
  tagKeyValue: string;
  tagQueryString?: string;
  tagReportPathsType: TagPathsType;
}

interface TagValueStateProps {
  groupBy: string;
  groupByValue: string | number;
  tagReport?: Tag;
  tagReportFetchStatus?: FetchStatus;
}

interface TagValueDispatchProps {
  fetchTag?: typeof tagActions.fetchTag;
}

interface TagValueState {
  isTagValueExpanded: boolean;
}

type TagValueProps = TagValueOwnProps & TagValueStateProps & TagValueDispatchProps;

const tagReportType = TagType.tag;

// If the number of tag keys are greater or equal, then show text input Vs select
// See https://github.com/project-koku/koku/pull/2069
const tagKeyValueLimit = 50;

class TagValueBase extends React.Component<TagValueProps> {
  protected defaultState: TagValueState = {
    isTagValueExpanded: false,
  };
  public state: TagValueState = { ...this.defaultState };

  public componentDidMount() {
    const { fetchTag, tagQueryString, tagReportFetchStatus, tagReportPathsType } = this.props;

    if (tagReportFetchStatus !== FetchStatus.inProgress) {
      fetchTag(tagReportPathsType, tagReportType, tagQueryString);
    }
  }

  public componentDidUpdate(prevProps: TagValueProps) {
    const { fetchTag, tagQueryString, tagReportFetchStatus, tagReportPathsType } = this.props;

    if (
      (prevProps.tagQueryString !== tagQueryString || prevProps.tagReportPathsType !== tagReportPathsType) &&
      tagReportFetchStatus !== FetchStatus.inProgress
    ) {
      fetchTag(tagReportPathsType, tagReportType, tagQueryString);
    }
  }

  private getTagValueOptions(): ToolbarChipGroup[] {
    const { tagKey, tagReport } = this.props;

    let data = [];
    if (tagReport && tagReport.data) {
      data = [...new Set([...tagReport.data])]; // prune duplicates
    }

    let options = [];
    if (data.length > 0) {
      for (const tag of data) {
        if (tagKey === tag.key && tag.values) {
          options = tag.values.map(val => {
            return {
              key: val,
              name: val, // tag key values not localized
            };
          });
          break;
        }
      }
    }
    return options;
  }

  private onTagValueChange = value => {
    const { onTagValueInputChange } = this.props;

    this.setState({ tagKeyValueInput: value }, () => {
      if (onTagValueInputChange) {
        onTagValueInputChange(value);
      }
    });
  };

  private onTagValueToggle = isOpen => {
    this.setState({
      isTagValueExpanded: isOpen,
    });
  };

  public render() {
    const { isDisabled, onTagValueInput, onTagValueSelect, selections, tagKeyValue } = this.props;
    const { isTagValueExpanded } = this.state;

    const selectOptions = this.getTagValueOptions().map(selectOption => {
      return <SelectOption key={selectOption.key} value={selectOption.key} />;
    });

    if (selectOptions.length > tagKeyValueLimit) {
      return (
        <InputGroup>
          <TextInput
            isDisabled={isDisabled}
            name="tagkeyvalue-input"
            id="tagkeyvalue-input"
            type="search"
            aria-label={intl.formatMessage(messages.filterByTagValueAriaLabel)}
            onChange={this.onTagValueChange}
            value={tagKeyValue}
            placeholder={intl.formatMessage(messages.filterByTagValueInputPlaceholder)}
            onKeyDown={evt => onTagValueInput(evt)}
          />
          <Button
            isDisabled={isDisabled}
            variant={ButtonVariant.control}
            aria-label={intl.formatMessage(messages.filterByTagValueButtonAriaLabel)}
            onClick={evt => onTagValueInput(evt)}
          >
            <SearchIcon />
          </Button>
        </InputGroup>
      );
    }
    return (
      <Select
        isDisabled={isDisabled}
        variant={SelectVariant.checkbox}
        aria-label={intl.formatMessage(messages.filterByTagValueAriaLabel)}
        onToggle={this.onTagValueToggle}
        onSelect={onTagValueSelect}
        selections={selections}
        isOpen={isTagValueExpanded}
        placeholderText={intl.formatMessage(messages.filterByTagValuePlaceholder)}
      >
        {selectOptions}
      </Select>
    );
  }
}

const mapStateToProps = createMapStateToProps<TagValueOwnProps, TagValueStateProps>(
  (state, { tagKey, tagReportPathsType }) => {
    const query = parseQuery<Query>(location.search);

    const groupByOrgValue = getGroupByOrgValue(query);
    const groupBy = groupByOrgValue ? orgUnitIdKey : getGroupById(query);
    const groupByValue = groupByOrgValue ? groupByOrgValue : getGroupByValue(query);

    // Omitting key_only to share a single, cached request -- although the header doesn't need key values, the toolbar does
    const tagQueryString = getQuery({
      filter: {
        key: tagKey,
      },
    });
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
      tagQueryString,
      tagReport,
      tagReportFetchStatus,
    };
  }
);

const mapDispatchToProps: TagValueDispatchProps = {
  fetchTag: tagActions.fetchTag,
};

const TagValueConnect = connect(mapStateToProps, mapDispatchToProps)(TagValueBase);
const TagValue = injectIntl(TagValueConnect);

export { TagValue };
export type { TagValueProps };
