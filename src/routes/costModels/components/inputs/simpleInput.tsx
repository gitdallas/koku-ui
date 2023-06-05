import type { MessageDescriptor } from '@formatjs/intl/src/types';
import { FormGroupProps, FormHelperText, HelperText, HelperTextItem, TextInputProps } from '@patternfly/react-core';
import { FormGroup, TextInput } from '@patternfly/react-core';
import { intl as defaultIntl } from 'components/i18n';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';

interface SimpleInputOwnProps {
  helperTextInvalid?: MessageDescriptor | string;
  label?: MessageDescriptor | string;
}

type SimpleInputFormGroupProps = Pick<FormGroupProps, 'onBlur' | 'isRequired' | 'placeholder' | 'style'>;
type SimpleInputTextInputProps = Pick<TextInputProps, 'id' | 'onChange' | 'value' | 'validated'>;
type SimpleInputProps = SimpleInputOwnProps &
  SimpleInputTextInputProps &
  SimpleInputFormGroupProps &
  WrappedComponentProps;

const SimpleInputBase: React.FC<SimpleInputProps> = ({
  id,
  intl = defaultIntl, // Default required for testing
  label,
  isRequired,
  helperTextInvalid: helpText,
  onChange,
  onBlur,
  placeholder,
  style,
  validated,
  value,
}) => {
  return (
    <FormGroup
      isRequired={isRequired}
      style={style}
      fieldId={id}
      label={label !== null && typeof label === 'object' ? intl.formatMessage(label) : label}
    >
      <TextInput
        validated={validated} //TODO: 
        value={value}
        onChange={onChange}
        id={id}
        onBlur={onBlur}
        isRequired={isRequired}
        placeholder={placeholder}
      />
      {validated === "error" && helpText && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem variant="error">
              {typeof helpText === 'object' ? intl.formatMessage(helpText) : helpText}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
    </FormGroup>
  );
};

const SimpleInput = injectIntl(SimpleInputBase);
export { SimpleInput };
