import type { SelectOptionObject } from '@patternfly/react-core';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core';
import React from 'react';

interface ChartComparisonOwnProps {
  currentItem?: string;
  isDisabled?: boolean;
  onItemClicked(value: string);
  options?: {
    default?: boolean;
    label: string;
    value: string;
  }[];
}

interface ChartComparisonState {
  currentItem?: string;
  isSelectOpen: boolean;
}

interface ComparisonOption extends SelectOptionObject {
  toString(): string; // label
  value?: string;
}

type ChartComparisonProps = ChartComparisonOwnProps;

class ChartComparisonBase extends React.Component<ChartComparisonProps> {
  protected defaultState: ChartComparisonState = {
    currentItem: this.props.options ? this.props.options.find(option => option.default).value : undefined,
    isSelectOpen: false,
  };
  public state: ChartComparisonState = { ...this.defaultState };

  private getSelect = () => {
    const { isDisabled } = this.props;
    const { currentItem, isSelectOpen } = this.state;

    const selectOptions = this.getSelectOptions();
    const selection = selectOptions.find((option: ComparisonOption) => option.value === currentItem);

    return (
      <Select
        id="comparisonSelect"
        isDisabled={isDisabled}
        isOpen={isSelectOpen}
        onSelect={this.handleSelect}
        onToggle={(e, isOpen) => this.handleToggle(isOpen)}
        selections={selection}
        variant={SelectVariant.single}
      >
        {selectOptions.map(option => (
          <SelectOption key={option.value} value={option} />
        ))}
      </Select>
    );
  };

  private getSelectOptions = (): ComparisonOption[] => {
    const { options } = this.props;

    const selectOptions: ComparisonOption[] = [];

    options.map(option => {
      selectOptions.push({
        toString: () => option.label,
        value: option.value,
      });
    });

    return selectOptions;
  };

  private handleSelect = (event, selection: ComparisonOption) => {
    const { onItemClicked } = this.props;

    if (onItemClicked) {
      onItemClicked(selection.value);
    }
    this.setState({
      currentItem: selection.value,
      isSelectOpen: false,
    });
  };

  private handleToggle = isSelectOpen => {
    this.setState({ isSelectOpen });
  };

  public render() {
    return this.getSelect();
  }
}

const ChartComparison = ChartComparisonBase;

export { ChartComparison };
