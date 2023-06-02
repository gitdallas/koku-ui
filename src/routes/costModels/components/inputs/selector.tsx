import type { MessageDescriptor } from '@formatjs/intl/src/types';
import {
	FormGroupProps,
	FormSelectProps
} from '@patternfly/react-core';
import {
	SelectOptionObject
} from '@patternfly/react-core/deprecated';
import {
	FormGroup
} from '@patternfly/react-core';
import {
	Select,
	SelectDirection,
	SelectOption,
	SelectVariant
} from '@patternfly/react-core/deprecated';
import { intl as defaultIntl } from 'components/i18n';
import React, { useEffect, useState } from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';

interface SelectorFormGroupOwnProps {
  helperTextInvalid?: MessageDescriptor | string;
  isInvalid?: boolean;
  label?: MessageDescriptor | string;
  appendMenuTo?: HTMLElement | 'parent' | 'inline' | (() => HTMLElement);
  toggleAriaLabel?: string;
  maxHeight?: string | number;
  placeholderText?: string;
  direction?: SelectDirection.up | SelectDirection.down;
  options: {
    label: MessageDescriptor | string;
    value: any;
    description?: string;
  }[];
}

interface SelectorOption extends SelectOptionObject {
  toString(): string; // label
  value?: string;
  description?: string;
}

type SelectorFormGroupProps = Pick<FormGroupProps, 'style'>;
type SelectorFormSelectProps = Pick<
  FormSelectProps,
  'isDisabled' | 'value' | 'onChange' | 'aria-label' | 'id' | 'isRequired'
>;

type SelectorProps = SelectorFormGroupOwnProps &
  SelectorFormGroupProps &
  SelectorFormSelectProps &
  WrappedComponentProps;

const SelectorBase: React.FC<SelectorProps> = ({
  'aria-label': ariaLabel,
  helperTextInvalid: helpText,
  id,
  intl = defaultIntl, // Default required for testing
  toggleAriaLabel,
  maxHeight,
  placeholderText,
  direction = SelectDirection.down,
  isInvalid = false,
  isRequired = false,
  appendMenuTo = 'parent',
  label,
  value,
  onChange,
  options,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState<SelectorOption>(null);

  useEffect(() => {
    if (!value) {
      setSelection(null);
    } else {
      setSelection(value);
    }
  }, [value]);

  const getSelectorOptions = (): SelectorOption[] => {
    const ret = options.map(option => {
      return {
        toString: () => (typeof option.label === 'object' ? intl.formatMessage(option.label) : option.label),
        value: option.value,
        description: option.description,
      } as SelectorOption;
    });
    return ret;
  };
  return (
    <FormGroup
      isRequired={isRequired}
      style={style}
      fieldId={id}
      label={label !== null && typeof label === 'object' ? intl.formatMessage(label) : label}
      // helperTextInvalid={helpText !== null && typeof helpText === 'object' ? intl.formatMessage(helpText) : helpText}
      // validated={isInvalid ? 'error' : 'default'} TODO: Use FormHelperText, HelperText, and HelperTextItem directly inside children  
    >
      <Select
        id={id}
        ouiaId={id}
        maxHeight={maxHeight}
        toggleAriaLabel={toggleAriaLabel}
        variant={SelectVariant.single}
        placeholderText={placeholderText}
        aria-label={ariaLabel}
        direction={direction}
        menuAppendTo={appendMenuTo}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        onSelect={(e, sel: SelectorOption) => {
          setSelection(sel);
          onChange(null, sel.value);
          setIsOpen(false);
        }}
        selections={selection}
      >
        {getSelectorOptions().map(opt => (
          <SelectOption key={`${opt.value}`} value={opt} description={opt.description} />
        ))}
      </Select>
    </FormGroup>
  );
};

const Selector = injectIntl(SelectorBase);
export { Selector };
