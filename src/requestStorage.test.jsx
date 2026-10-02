// @vitest-environment jsdom
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App.jsx'
import { initialRequests } from './requests.js'
import { isValidRequests, loadRequests, nextRequestId, saveRequests, STORAGE_KEY } from './requestStorage.js'

beforeEach(() => window.localStorage.clear())
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.localStorage.clear()
})

function storedRequests() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY))
}

function fillDraft() {
  fireEvent.change(screen.getByLabelText('Room/location (required)'), { target: { value: '  Hallway  ' } })
  fireEvent.change(screen.getByLabelText('Problem title (required)'), { target: { value: '  Light broken  ' } })
  fireEvent.change(screen.getByLabelText('Description (optional)'), { target: { value: '  Replace bulb.  ' } })
  fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'High' } })
}

describe('stored request validation', () => {
  it('seeds only a missing value, without writing on load', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem')
    expect(loadRequests()).toEqual({ requests: initialRequests, error: '' })
    expect(write).not.toHaveBeenCalled()
    window.localStorage.setItem(STORAGE_KEY, '[]')
    expect(loadRequests()).toEqual({ requests: [], error: '' })
  })

  it.each([
    ['malformed JSON', '{broken'],
    ['null', 'null'],
    ['object instead of array', '{}'],
    ['duplicate IDs', JSON.stringify([initialRequests[0], initialRequests[0]])],
    ['invalid status', JSON.stringify([{ ...initialRequests[0], status: 'Closed' }])],
    ['invalid priority', JSON.stringify([{ ...initialRequests[0], priority: 'Urgent' }])],
    ['missing description', JSON.stringify([{ ...initialRequests[0], description: undefined }])],
    ['blank title', JSON.stringify([{ ...initialRequests[0], title: '   ' }])],
    ['blank location', JSON.stringify([{ ...initialRequests[0], location: '   ' }])],
    ['string ID', JSON.stringify([{ ...initialRequests[0], id: '1' }])],
    ['unsafe ID', JSON.stringify([{ ...initialRequests[0], id: Number.MAX_SAFE_INTEGER + 1 }])],
    ['negative ID', JSON.stringify([{ ...initialRequests[0], id: -1 }])],
    ['null record', '[null]'],
  ])('preserves %s on load and attempted save', (_, raw) => {
    window.localStorage.setItem(STORAGE_KEY, raw)
    const write = vi.spyOn(Storage.prototype, 'setItem')
    const loaded = loadRequests()
    expect(loaded.requests).toEqual([])
    expect(loaded.error).toContain('preserved')
    expect(saveRequests(initialRequests).ok).toBe(false)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(raw)
    expect(write).not.toHaveBeenCalled()
  })

  it('handles unavailable storage access and read errors without crashing', () => {
    const getter = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('Blocked') })
    expect(loadRequests().error).toContain('unavailable')
    expect(saveRequests(initialRequests).ok).toBe(false)
    getter.mockRestore()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
    expect(loadRequests().requests).toEqual([])
    expect(saveRequests(initialRequests).ok).toBe(false)
  })

  it('rejects invalid outgoing records and allocates safe IDs at the numeric limit', () => {
    expect(saveRequests([{ ...initialRequests[0], id: 0 }]).ok).toBe(false)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    const requests = [{ ...initialRequests[0], id: Number.MAX_SAFE_INTEGER }, initialRequests[0]]
    const id = nextRequestId(requests)
    expect(id).toBe(2)
    expect(isValidRequests([...requests, { ...initialRequests[0], id }])).toBe(true)
  })
})

describe('App persistence and submission results', () => {
  it('saves a new request and status change, then restores them after remount', () => {
    const view = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Resolved', exact: true }))
    fillDraft()
    fireEvent.click(screen.getByRole('button', { name: 'Add request' }))
    expect(storedRequests().at(-1)).toEqual({ id: 4, location: 'Hallway', title: 'Light broken', description: 'Replace bulb.', priority: 'High', status: 'Open' })
    expect(screen.getByRole('button', { name: 'All', exact: true }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('heading', { name: 'Light broken' })).toBeTruthy()
    expect(screen.getByLabelText('Room/location (required)').value).toBe('')
    expect(screen.getByLabelText('Priority').value).toBe('Medium')
    expect(screen.getByText(/Request saved in this browser as Open/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Request status'), { target: { value: 'Resolved' } })
    expect(storedRequests().at(-1).status).toBe('Resolved')
    view.unmount()
    render(<App />)
    expect(screen.getByText('4 total')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Hallway.*Light broken/ }))
    expect(screen.getByLabelText('Request status').value).toBe('Resolved')
    expect(screen.getByText('2', { selector: '.count-card strong' })).toBeTruthy()
  })

  it('keeps saved empty data empty, including in StrictMode, and can add to it', () => {
    window.localStorage.setItem(STORAGE_KEY, '[]')
    const write = vi.spyOn(Storage.prototype, 'setItem')
    render(<StrictMode><App /></StrictMode>)
    expect(screen.getByText('0 total')).toBeTruthy()
    expect(screen.getByText('0', { selector: '.count-card strong' })).toBeTruthy()
    expect(screen.getByText('Select a request to view its details.')).toBeTruthy()
    expect(write).not.toHaveBeenCalled()
    fillDraft()
    fireEvent.click(screen.getByRole('button', { name: 'Add request' }))
    expect(storedRequests()).toHaveLength(1)
    expect(storedRequests()[0].id).toBe(1)
  })

  it('shows invalid-data errors and keeps both raw storage and form drafts', () => {
    window.localStorage.setItem(STORAGE_KEY, 'bad JSON')
    render(<App />)
    expect(screen.getByText(/Saved requests could not be read or are invalid/)).toBeTruthy()
    fillDraft()
    fireEvent.click(screen.getByRole('button', { name: 'Add request' }))
    expect(screen.getByLabelText('Problem title (required)').value).toBe('  Light broken  ')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('bad JSON')
    expect(screen.queryByText(/Request saved in this browser as Open/)).toBeNull()
    expect(screen.getByText('0 total')).toBeTruthy()
  })

  it('keeps requests, filter, selection, and draft unchanged on save failure, then permits retry', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRequests))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Resolved', exact: true }))
    fillDraft()
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded') })
    fireEvent.click(screen.getByRole('button', { name: 'Add request' }))
    expect(screen.getByLabelText('Room/location (required)').value).toBe('  Hallway  ')
    expect(screen.getByLabelText('Priority').value).toBe('High')
    expect(screen.getByRole('button', { name: 'Resolved', exact: true }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('heading', { name: 'Sink leaking' })).toBeTruthy()
    expect(screen.queryByText(/Request saved in this browser as Open/)).toBeNull()
    expect(screen.getByText('3 total')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Request status'), { target: { value: 'Resolved' } })
    expect(screen.getByLabelText('Request status').value).toBe('Open')
    expect(screen.getByText('2', { selector: '.count-card strong' })).toBeTruthy()
    expect(storedRequests()).toEqual(initialRequests)
    write.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: 'Add request' }))
    expect(storedRequests().at(-1).id).toBe(4)
    expect(screen.getByLabelText('Room/location (required)').value).toBe('')
    expect(screen.getByText('3', { selector: '.count-card strong' })).toBeTruthy()
  })

  it('preserves malformed data introduced after loading', () => {
    render(<App />)
    window.localStorage.setItem(STORAGE_KEY, 'null')
    fireEvent.change(screen.getByLabelText('Request status'), { target: { value: 'Resolved' } })
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('null')
    expect(screen.getByLabelText('Request status').value).toBe('Open')
    expect(screen.getByRole('alert').textContent).toContain('not saved')
  })

  it('allocates distinct stable IDs after loading and repeated submissions', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...initialRequests[0], id: 75 }]))
    render(<App />)
    for (let index = 0; index < 2; index += 1) {
      fillDraft()
      fireEvent.click(screen.getByRole('button', { name: 'Add request' }))
    }
    expect(storedRequests().map((request) => request.id)).toEqual([75, 76, 77])
    fireEvent.change(screen.getByLabelText('Request status'), { target: { value: 'In progress' } })
    expect(storedRequests().map((request) => request.id)).toEqual([75, 76, 77])
  })
})
