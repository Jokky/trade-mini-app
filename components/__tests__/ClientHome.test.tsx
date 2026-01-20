import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientHome from '../ClientHome';

// Minimal unit tests to cover token-present and token-absent flows.
// TODO: expand tests and mock fetch responses more thoroughly.

describe('ClientHome', () => {
  beforeEach(() => {
    localStorage.clear();
    // simple fetch mock; individual tests can override
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })) as any;
  });

  it('shows token input when no token stored', () => {
    render(<ClientHome />);
    expect(screen.getByPlaceholderText(/enter api token/i)).toBeInTheDocument();
  });

  it('saves token on submit and attempts to fetch portfolio', async () => {
    const fetchMock = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
    (global as any).fetch = fetchMock;

    render(<ClientHome />);
    const input = screen.getByPlaceholderText(/enter api token/i);
    const button = screen.getByRole('button', { name: /submit/i });

    fireEvent.change(input, { target: { value: 'my-token' } });
    fireEvent.click(button);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(localStorage.getItem('authToken')).toBe('my-token');
  });
});
