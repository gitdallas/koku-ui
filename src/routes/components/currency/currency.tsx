import './currency.scss';

import type { MessageDescriptor } from '@formatjs/intl/src/types';
import type { SelectOptionObject } from '@patternfly/react-core';
import { Select, SelectOption, SelectVariant, Title } from '@patternfly/react-core';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { createMapStateToProps } from 'store/common';
import { invalidateSession, setCurrency } from 'utils/localStorage';

import { styles } from './currency.styles';

interface CurrencyOwnProps {
  currency?: string;
  isDisabled?: boolean;
  onSelect?: (value: string) => void;
}

interface CurrencyDispatchProps {
  // TBD...
}

interface CurrencyStateProps {
  // TBD...
}

interface CurrencyState {
  isSelectOpen: boolean;
}

interface CurrencyOption extends SelectOptionObject {
  toString(): string; // label
  value?: string;
}

type CurrencyProps = CurrencyOwnProps & CurrencyDispatchProps & CurrencyStateProps & WrappedComponentProps;

export const currencyOptions: {
  label: MessageDescriptor;
  value: string;
}[] = [
  { label: messages.currencyOptions, value: 'AUD' },
  { label: messages.currencyOptions, value: 'CAD' },
  { label: messages.currencyOptions, value: 'CHF' },
  { label: messages.currencyOptions, value: 'CNY' },
  { label: messages.currencyOptions, value: 'DKK' },
  { label: messages.currencyOptions, value: 'EUR' },
  { label: messages.currencyOptions, value: 'GBP' },
  { label: messages.currencyOptions, value: 'HKD' },
  { label: messages.currencyOptions, value: 'JPY' },
  { label: messages.currencyOptions, value: 'NOK' },
  { label: messages.currencyOptions, value: 'NZD' },
  { label: messages.currencyOptions, value: 'SEK' },
  { label: messages.currencyOptions, value: 'SGD' },
  { label: messages.currencyOptions, value: 'USD' },
  { label: messages.currencyOptions, value: 'ZAR' },
];

class CurrencyBase extends React.Component<CurrencyProps, CurrencyState> {
  protected defaultState: CurrencyState = {
    isSelectOpen: false,
  };
  public state: CurrencyState = { ...this.defaultState };

  private getSelect = () => {
    const { currency, isDisabled } = this.props;
    const { isSelectOpen } = this.state;

    const selectOptions = this.getSelectOptions();
    const selection = selectOptions.find((option: CurrencyOption) => option.value === currency);

    return (
      <Select
        className="currencyOverride"
        id="currencySelect"
        isDisabled={isDisabled}
        isOpen={isSelectOpen}
        onSelect={this.handleSelect}
        onToggle={this.handleToggle}
        selections={selection}
        variant={SelectVariant.single}
      >
        {selectOptions.map(option => (
          <SelectOption key={option.value} value={option} />
        ))}
      </Select>
    );
  };

  private getSelectOptions = (): CurrencyOption[] => {
    const { intl } = this.props;

    const options: CurrencyOption[] = [];

    currencyOptions.map(option => {
      options.push({
        toString: () => intl.formatMessage(option.label, { units: option.value }),
        value: option.value,
      });
    });
    return options;
  };

  private handleSelect = (event, selection: CurrencyOption) => {
    const { onSelect } = this.props;

    setCurrency(selection.value); // Set currency units via local storage

    this.setState(
      {
        isSelectOpen: false,
      },
      () => {
        if (onSelect) {
          onSelect(selection.value);
        }
      }
    );
  };

  private handleToggle = (_event, isSelectOpen) => {
    this.setState({ isSelectOpen });
  };

  public render() {
    const { intl } = this.props;

    // Clear local storage value if current session is not valid
    invalidateSession();

    return (
      <div style={styles.currencySelector}>
        <Title headingLevel="h2" size="md" style={styles.currencyLabel}>
          {intl.formatMessage(messages.currency)}
        </Title>
        {this.getSelect()}
      </div>
    );
  }
}

const mapStateToProps = createMapStateToProps<CurrencyOwnProps, CurrencyStateProps>(() => {
  return {
    // TBD...
  };
});

const mapDispatchToProps: CurrencyDispatchProps = {
  // TBD...
};

const CurrencyConnect = connect(mapStateToProps, mapDispatchToProps)(CurrencyBase);
const Currency = injectIntl(CurrencyConnect);

export default Currency;
