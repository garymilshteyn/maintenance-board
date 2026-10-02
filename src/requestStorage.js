import { initialRequests, priorities, statuses } from './requests.js'

export const STORAGE_KEY = 'maintenance-board-requests-v1'

export function isValidRequests(value) {
  if (!Array.isArray(value)) return false
  const ids = new Set()
  return value.every((request) => {
    if (!request || typeof request !== 'object' || Array.isArray(request)) return false
    const valid = Number.isSafeInteger(request.id) && request.id > 0
      && !ids.has(request.id)
      && typeof request.location === 'string' && request.location.trim().length > 0
      && typeof request.title === 'string' && request.title.trim().length > 0
      && typeof request.description === 'string'
      && statuses.includes(request.status) && priorities.includes(request.priority)
    ids.add(request.id)
    return valid
  })
}

function parseSavedRequests(saved) {
  if (saved === null) return null
  const parsed = JSON.parse(saved)
  if (!isValidRequests(parsed)) throw new Error('Invalid request records')
  return parsed
}

export function loadRequests() {
  let saved
  try {
    // Accessing localStorage itself can throw when browser storage is blocked.
    saved = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return { requests: [], error: 'Browser storage is unavailable. Saved requests could not be loaded. No stored data has been changed.' }
  }
  try {
    const requests = parseSavedRequests(saved)
    return { requests: requests === null ? initialRequests : requests, error: '' }
  } catch {
    return { requests: [], error: 'Saved requests could not be read or are invalid. The stored value has been preserved. Back it up and repair or remove it in browser storage before trying again.' }
  }
}

export function saveRequests(requests) {
  try {
    const storage = window.localStorage
    // Check again before writing: never overwrite malformed data, even if it
    // appeared after this tab opened. Loading and rendering never write data.
    try {
      parseSavedRequests(storage.getItem(STORAGE_KEY))
    } catch {
      return { ok: false, error: 'This change was not saved. Existing storage could not be read or is invalid and has been preserved. Back it up and repair or remove it before trying again.' }
    }
    if (!isValidRequests(requests)) {
      return { ok: false, error: 'This change was not saved because the request data is invalid.' }
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(requests))
    return { ok: true, error: '' }
  } catch {
    return { ok: false, error: 'This change was not saved. Browser storage may be blocked or full. Your displayed requests and any form draft have been kept. Try again after making storage available.' }
  }
}

export function nextRequestId(requests) {
  const ids = new Set(requests.map((request) => request.id))
  const largestId = requests.reduce((largest, request) => Math.max(largest, request.id), 0)
  let id = largestId < Number.MAX_SAFE_INTEGER ? largestId + 1 : 1
  while (ids.has(id)) id += 1
  return id
}
