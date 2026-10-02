// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import CloudSampleRequests from './CloudSampleRequests.jsx'
import App from './App.jsx'
import { fetchCloudSampleRequests } from './supabase.js'

vi.mock('./supabase.js', () => ({ fetchCloudSampleRequests: vi.fn() }))
afterEach(() => {
  cleanup()
  vi.resetAllMocks()
  window.localStorage.clear()
})

it('shows loading and then read-only records without touching local board data', async () => {
  let finish
  fetchCloudSampleRequests.mockImplementation(() => new Promise((resolve) => { finish = resolve }))
  const storedBefore = window.localStorage.getItem('maintenance-board-requests-v1')
  render(<App />)
  expect(screen.getByText('Loading cloud sample requests…')).toBeTruthy()
  finish([{ id: 20, location: 'Cloud room', title: 'Cloud repair', priority: 'Low', status: 'Open' }])
  const section = screen.getByRole('region', { name: 'Cloud sample requests' })
  expect(await within(section).findByText('Cloud repair')).toBeTruthy()
  expect(within(section).queryByRole('button')).toBeNull()
  expect(within(section).queryByRole('combobox')).toBeNull()
  expect(screen.getByText('3 total')).toBeTruthy()
  expect(screen.getByText('2', { selector: '.count-card strong' })).toBeTruthy()
  expect(window.localStorage.getItem('maintenance-board-requests-v1')).toBe(storedBefore)
})

it('shows errors and Retry, then handles an empty successful response', async () => {
  fetchCloudSampleRequests.mockRejectedValueOnce(new Error('Cloud samples are not configured.'))
    .mockResolvedValueOnce([])
  render(<CloudSampleRequests />)
  expect((await screen.findByRole('alert')).textContent).toContain('not configured')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText('No cloud sample requests are available.')).toBeTruthy()
  expect(fetchCloudSampleRequests).toHaveBeenCalledTimes(2)
})

it('aborts on unmount so late responses are ignored', async () => {
  fetchCloudSampleRequests.mockResolvedValue([])
  const view = render(<CloudSampleRequests />)
  await waitFor(() => expect(fetchCloudSampleRequests).toHaveBeenCalledTimes(1))
  const signal = fetchCloudSampleRequests.mock.calls[0][0]
  view.unmount()
  expect(signal.aborted).toBe(true)
})
