import {
	FormGroup,
	Stack,
	StackItem,
	TextArea,
	TextInput,
	Title,
	TitleSizes
} from '@patternfly/react-core';
import {
	SelectDirection as SelectDirectionDeprecated
} from '@patternfly/react-core/deprecated';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { currencyOptions } from 'routes/components/currency';
import { Form } from 'routes/costModels/components/forms/form';
import { Selector } from 'routes/costModels/components/inputs/selector';
import { createMapStateToProps } from 'store/common';

import { CostModelContext } from './context';
import { descriptionErrors, nameErrors } from './steps';
import { styles } from './wizard.styles';

interface GeneralInformationOwnProps {
  // TBD...
}

interface GeneralInformationStateProps {
  // TBD..
}

interface GeneralInformationDispatchProps {
  // TBD...
}

type GeneralInformationProps = GeneralInformationOwnProps &
  GeneralInformationStateProps &
  GeneralInformationDispatchProps &
  WrappedComponentProps;

class GeneralInformation extends React.Component<GeneralInformationProps, any> {
  public render() {
    const getValueLabel = (valStr: string, options) => {
      const val = options.find(o => o.value === valStr);
      return !val ? valStr : intl.formatMessage(val.label, { units: val.value });
    };
    const { intl } = this.props;
    const sourceTypeOptions = [
      {
        label: messages.costModelsWizardOnboardAws,
        value: 'AWS',
      },
      {
        label: messages.azure,
        value: 'Azure',
      },
      {
        label: messages.gcp,
        value: 'GCP',
      },
      {
        label: messages.costModelsWizardOnboardOcp,
        value: 'OCP',
      },
    ];

    return (
      <CostModelContext.Consumer>
        {({
          currencyUnits,
          dirtyName,
          description,
          name,
          type,
          onCurrencyChange,
          onNameChange,
          onDescChange,
          onTypeChange,
        }) => (
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h2" size={TitleSizes.xl} style={styles.titleWithLearnMore}>
                {intl.formatMessage(messages.costModelsWizardGeneralInfoTitle)}
              </Title>
              <a href={intl.formatMessage(messages.docsConfigCostModels)} rel="noreferrer" target="_blank">
                {intl.formatMessage(messages.learnMore)}
              </a>
            </StackItem>
            <StackItem>
              <Form style={styles.form}>
                <FormGroup
                  helperTextInvalid={nameErrors(name) && intl.formatMessage(nameErrors(name))}
                  validated={nameErrors(name) === null || !dirtyName ? 'default' : 'error'}
                  label={intl.formatMessage(messages.names, { count: 1 })}
                  isRequired
                  fieldId="name"
                >
                  <TextInput
                    validated={nameErrors(name) === null || !dirtyName ? 'default' : 'error'}
                    isRequired
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={onNameChange}
                  />
                </FormGroup>
                <FormGroup
                  helperTextInvalid={
                    descriptionErrors(description) && intl.formatMessage(descriptionErrors(description))
                  }
                  validated={descriptionErrors(description) === null ? 'default' : 'error'}
                  label={intl.formatMessage(messages.description)}
                  fieldId="description"
                >
                  <TextArea
                    style={styles.textArea}
                    type="text"
                    id="description"
                    name="description"
                    value={description}
                    validated={descriptionErrors(description) === null ? 'default' : 'error'}
                    onChange={onDescChange}
                  />
                </FormGroup>
                <Selector
                  isRequired
                  id="source-type-selector"
                  direction={SelectDirectionDeprecated.up}
                  appendMenuTo="inline"
                  maxHeight={styles.selector.maxHeight}
                  label={messages.sourceType}
                  toggleAriaLabel={intl.formatMessage(messages.costModelsWizardEmptySourceTypeLabel)}
                  placeholderText={intl.formatMessage(messages.costModelsWizardEmptySourceTypeLabel)}
                  value={getValueLabel(type, sourceTypeOptions)}
                  onChange={onTypeChange}
                  options={sourceTypeOptions}
                />
                <Selector
                  label={messages.currency}
                  direction={SelectDirectionDeprecated.up}
                  appendMenuTo="inline"
                  maxHeight={styles.selector.maxHeight}
                  toggleAriaLabel={intl.formatMessage(messages.costModelsWizardCurrencyToggleLabel)}
                  value={getValueLabel(currencyUnits, currencyOptions)}
                  onChange={onCurrencyChange}
                  id="currency-units-selector"
                  options={currencyOptions.map(o => {
                    return {
                      label: intl.formatMessage(o.label, { units: o.value }),
                      value: o.value,
                    };
                  })}
                />
              </Form>
            </StackItem>
          </Stack>
        )}
      </CostModelContext.Consumer>
    );
  }
}

const mapStateToProps = createMapStateToProps<GeneralInformationOwnProps, GeneralInformationStateProps>(() => {
  return {
    // TBD...
  };
});

const mapDispatchToProps: GeneralInformationDispatchProps = {
  // TDB
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(GeneralInformation));
