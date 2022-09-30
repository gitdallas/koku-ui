import {
  Flex,
  FlexItem,
  FormGroup,
  InputGroup,
  InputGroupText,
  List,
  ListItem,
  Radio,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextInput,
  TextVariants,
  Title,
  TitleSizes,
} from '@patternfly/react-core';
import messages from 'locales/messages';
import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { Form } from 'routes/costModels/components/forms/form';
import { styles } from 'routes/costModels/costModel/costCalc.styles';
import { countDecimals, isPercentageFormatValid } from 'utils/format';

import { CostModelContext } from './context';

class MarkupWithDistribution extends React.Component<WrappedComponentProps> {
  public render() {
    const { intl } = this.props;

    const handleOnKeyDown = event => {
      // Prevent 'enter', '+', and '-'
      if (event.keyCode === 13 || event.keyCode === 187 || event.keyCode === 189) {
        event.preventDefault();
      }
    };

    const markupValidator = value => {
      if (!isPercentageFormatValid(value)) {
        return messages.markupOrDiscountNumber;
      }
      // Test number of decimals
      const decimals = countDecimals(value);
      if (decimals > 10) {
        return messages.markupOrDiscountTooLong;
      }
      return undefined;
    };

    return (
      <CostModelContext.Consumer>
        {({
          handleDistributionChange,
          handleSignChange,
          handleMarkupDiscountChange,
          markup,
          isDiscount,
          distribution,
          type,
        }) => {
          const helpText = markupValidator(markup);
          const validated = helpText ? 'error' : 'default';

          return (
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h2" size={TitleSizes.xl}>
                  {intl.formatMessage(messages.costCalculations)}
                </Title>
              </StackItem>
              <StackItem>
                <Title headingLevel="h3" size="md">
                  {intl.formatMessage(messages.markupOrDiscount)}
                </Title>
                {intl.formatMessage(messages.markupOrDiscountModalDesc)}
              </StackItem>
              <StackItem>
                <Flex style={styles.markupRadioContainer}>
                  <Flex direction={{ default: 'column' }} alignSelf={{ default: 'alignSelfCenter' }}>
                    <FlexItem>
                      <Radio
                        isChecked={!isDiscount}
                        name="discount"
                        label={intl.formatMessage(messages.markupPlus)}
                        aria-label={intl.formatMessage(messages.markupPlus)}
                        id="markup"
                        value="false" // "+"
                        onChange={handleSignChange}
                        style={styles.markupRadio}
                      />
                      <Radio
                        isChecked={isDiscount}
                        name="discount"
                        label={intl.formatMessage(messages.discountMinus)}
                        aria-label={intl.formatMessage(messages.discountMinus)}
                        id="discount"
                        value="true" // '-'
                        onChange={handleSignChange}
                      />
                    </FlexItem>
                  </Flex>
                  <Flex direction={{ default: 'column' }} alignSelf={{ default: 'alignSelfCenter' }}>
                    <FlexItem>
                      <Form>
                        <FormGroup
                          fieldId="markup-input-box"
                          helperTextInvalid={helpText ? intl.formatMessage(helpText) : undefined}
                          style={styles.rateContainer}
                          validated={validated}
                        >
                          <InputGroup>
                            <InputGroupText style={styles.sign}>
                              {isDiscount
                                ? intl.formatMessage(messages.discountMinus)
                                : intl.formatMessage(messages.markupPlus)}
                            </InputGroupText>
                            <TextInput
                              aria-label={intl.formatMessage(messages.rate)}
                              id="markup-input-box"
                              isRequired
                              onKeyDown={handleOnKeyDown}
                              onChange={handleMarkupDiscountChange}
                              placeholder={'0'}
                              style={styles.inputField}
                              type="text"
                              validated={validated}
                              value={markup}
                            />
                            <InputGroupText style={styles.percent}>
                              {intl.formatMessage(messages.percentSymbol)}
                            </InputGroupText>
                          </InputGroup>
                        </FormGroup>
                      </Form>
                    </FlexItem>
                  </Flex>
                </Flex>
              </StackItem>
              <StackItem>
                <div style={styles.exampleMargin}>
                  <TextContent>
                    <Text component={TextVariants.h3}>{intl.formatMessage(messages.examplesTitle)}</Text>
                  </TextContent>
                  <List>
                    <ListItem>{intl.formatMessage(messages.costModelsExamplesNoAdjust)}</ListItem>
                    <ListItem>{intl.formatMessage(messages.costModelsExamplesDoubleMarkup)}</ListItem>
                    <ListItem>{intl.formatMessage(messages.costModelsExamplesReduceZero)}</ListItem>
                    <ListItem>{intl.formatMessage(messages.costModelsExamplesReduceSeventyfive)}</ListItem>
                  </List>
                </div>
              </StackItem>
              {type === 'OCP' && (
                <>
                  <StackItem>
                    <Title headingLevel="h3" size="md">
                      {intl.formatMessage(messages.distributionType)}
                    </Title>
                    <TextContent>
                      <Text style={styles.cardDescription}>{intl.formatMessage(messages.distributionModelDesc)}</Text>
                    </TextContent>
                  </StackItem>
                  <StackItem isFilled>
                    <Form>
                      <FormGroup isInline fieldId="cost-distribution" isRequired>
                        <Radio
                          isChecked={distribution === 'cpu'}
                          name="distribution"
                          label={intl.formatMessage(messages.cpuTitle)}
                          aria-label={intl.formatMessage(messages.cpuTitle)}
                          id="cpuDistribution"
                          value="cpu"
                          onChange={handleDistributionChange}
                        />
                        <Radio
                          isChecked={distribution === 'memory'}
                          name="distribution"
                          label={intl.formatMessage(messages.memoryTitle)}
                          aria-label={intl.formatMessage(messages.memoryTitle)}
                          id="memoryDistribution"
                          value="memory"
                          onChange={handleDistributionChange}
                        />
                      </FormGroup>
                    </Form>
                  </StackItem>
                </>
              )}
            </Stack>
          );
        }}
      </CostModelContext.Consumer>
    );
  }
}

export default injectIntl(MarkupWithDistribution);
