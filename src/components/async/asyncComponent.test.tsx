import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import asyncComponent from './asyncComponent';

const UnwrappedComponent = props => <div>{props.quote || 'Unwrapped'}</div>;

test('renders empty while loading', async () => {
  const loader = jest.fn(() => Promise.resolve(UnwrappedComponent));
  const Wrapped = asyncComponent(loader);
  render(<Wrapped />);
  expect(loader).toBeCalled();
  expect(screen.queryByText(/unwrapped/i)).toBeNull();
});

test('component is loaded on mount', async () => {
  const loader = jest.fn(() => Promise.resolve(UnwrappedComponent));
  const Wrapped = asyncComponent(loader);
  render(<Wrapped />);
  await waitFor(() => expect(loader).toHaveBeenCalled);
  expect(screen.getByText('Unwrapped')).not.toBeNull();
});

test('component with default export is used', async () => {
  const loader = jest.fn(() => Promise.resolve({ default: UnwrappedComponent }));
  const Wrapped = asyncComponent(loader);
  render(<Wrapped />);
  await waitFor(() => expect(loader).toHaveBeenCalled);
  expect(screen.getByText('Unwrapped')).not.toBeNull();
});

test('only loades the component once', async () => {
  const loader = jest.fn(() => Promise.resolve(UnwrappedComponent));
  const Wrapped = asyncComponent(loader);
  const view = render(<Wrapped />);
  view.rerender(<Wrapped />);
  await waitFor(() => expect(loader).toHaveBeenCalled);
  expect(loader).toHaveBeenCalledTimes(1);
});

test('spreads props to wrapped component', async () => {
  const loader = jest.fn(() => Promise.resolve(UnwrappedComponent));
  const Wrapped = asyncComponent<any>(loader);
  const quote = 'The only winning move is not to play.';
  render(<Wrapped quote={quote} />);
  await waitFor(() => expect(loader).toHaveBeenCalled);
  expect(screen.getByText(quote)).not.toBeNull();
});
