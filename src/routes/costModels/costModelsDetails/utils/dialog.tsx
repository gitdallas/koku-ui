import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextList,
  TextListItem,
  TextListVariants,
} from '@patternfly/react-core';
import React from 'react';

export function DeleteDialogActions({
  status,
  deleteText,
  deleteAction,
  cancelText,
  cancelAction,
  sourcesNo,
}): JSX.Element[] {
  let actions = [];
  if (status === 'loading') {
    actions = [
      <Button key="pending_delete" variant={ButtonVariant.danger} isDisabled>
        {deleteText}
      </Button>,
      <Button key="pending_cancel" variant={ButtonVariant.link} isDisabled>
        {cancelText}
      </Button>,
    ];
  }
  if (['failure', 'open'].includes(status) && sourcesNo > 0) {
    actions = [
      <Button key="sources_cancel" variant={ButtonVariant.link} onClick={cancelAction}>
        {cancelText}
      </Button>,
    ];
  }
  if (['failure', 'open'].includes(status) && sourcesNo === 0) {
    actions = [
      <Button key="delete" variant={ButtonVariant.danger} onClick={deleteAction}>
        {deleteText}
      </Button>,
      <Button key="cancel" variant={ButtonVariant.link} onClick={cancelAction}>
        {cancelText}
      </Button>,
    ];
  }
  return actions;
}

interface CannotDeleteContentProps {
  head: string;
  body: string;
  sources: string[];
}

function CannotDeleteContent({ head, body, sources }: CannotDeleteContentProps): JSX.Element {
  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Text>{head}</Text>
        </TextContent>
      </StackItem>
      <StackItem>
        <TextContent>
          <Text>{body}</Text>
          <TextList component={TextListVariants.ol}>
            {sources.map(source => (
              <TextListItem key={source}>{source}</TextListItem>
            ))}
          </TextList>
        </TextContent>
      </StackItem>
    </Stack>
  );
}

export function DeleteDialogBody({
  status,
  sources,
  error,
  cannotDeleteTitle,
  cannotDeleteBody,
  canDeleteBody,
}): JSX.Element {
  if (status !== 'close' && sources.length > 0) {
    return <CannotDeleteContent head={cannotDeleteTitle} body={cannotDeleteBody} sources={sources} />;
  }
  if (status !== 'close' && sources.length === 0) {
    return (
      <Stack hasGutter>
        {status === 'failure' ? (
          <StackItem>
            <Alert variant={AlertVariant.danger} title={error} />
          </StackItem>
        ) : null}
        <StackItem>{canDeleteBody}</StackItem>
      </Stack>
    );
  }
}

export function getDialogStateName(isLoading: boolean, isOpen: boolean, error: string): string {
  if (!isOpen) {
    return 'close';
  }
  if (isLoading) {
    return 'loading';
  }
  if (error) {
    return 'failure';
  }
  return 'open';
}
