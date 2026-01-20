import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ClientHome from '../ClientHome'

const STORAGE_KEY = 'authToken'

describe('ClientHome token flows (basic)', () => {
  beforeEach(() => {
    // reset fetch and localStorage
    ;(global as any).fetch = jest.fn()
    localStorage.clear()
  })

  test('shows token input when no token present', async () => {
    render(<ClientHome />)
    // expect an input textbox and a submit button to be present
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  test('submitting token persists and calls portfolio API with Authorization header', async () => {
    const fakeToken = 'valid-token-123'
    ;(global as any).fetch = jest.fn().mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [] }) })

    render(<ClientHome />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: fakeToken } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => expect((global as any).fetch).toHaveBeenCalled())

    const fetchCall = (global as any).fetch.mock.calls[0]
    const fetchOptions = fetchCall[1] || {}
    const headers = fetchOptions.headers || {}
    expect(headers.Authorization).toBe(`Bearer ${fakeToken}`)

    // token persisted
    expect(localStorage.getItem(STORAGE_KEY)).toBe(fakeToken)
  })

  test('invalid token (401) clears storage and shows token input', async () => {
    localStorage.setItem(STORAGE_KEY, 'bad-token')
    ;(global as any).fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 401 })

    render(<ClientHome />)

    // after effect runs, API called and token cleared
    await waitFor(() => expect((global as any).fetch).toHaveBeenCalled())
    await waitFor(() => expect(localStorage.getItem(STORAGE_KEY)).toBeNull())
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  test('pressing Enter submits token (keyboard)', async () => {
    const fakeToken = 'enter-token'
    ;(global as any).fetch = jest.fn().mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [] }) })

    render(<ClientHome />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: fakeToken } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => expect((global as any).fetch).toHaveBeenCalled())
    const headers = (global as any).fetch.mock.calls[0][1].headers
    expect(headers.Authorization).toBe(`Bearer ${fakeToken}`)
  })
})
