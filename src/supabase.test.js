import { afterEach, expect, it, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))
afterEach(() => {
  vi.resetAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('handles missing configuration without creating a client', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', '')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')
  const { fetchCloudSampleRequests } = await import('./supabase.js')
  await expect(fetchCloudSampleRequests()).rejects.toThrow('not configured')
  expect(createClient).not.toHaveBeenCalled()
})

it('rejects a non-publishable key before sending any request', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_secret_test-only')
  const { fetchCloudSampleRequests } = await import('./supabase.js')
  await expect(fetchCloudSampleRequests()).rejects.toThrow('require a Supabase publishable key')
  expect(createClient).not.toHaveBeenCalled()
})

it('queries only the requested public columns in ID order and reports read errors', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test-only')
  const query = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Forbidden' } }),
  }
  const from = vi.fn().mockReturnValue(query)
  createClient.mockReturnValue({ from })
  const { fetchCloudSampleRequests } = await import('./supabase.js')
  const signal = new AbortController().signal
  await expect(fetchCloudSampleRequests(signal)).resolves.toEqual([])
  expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'sb_publishable_test-only', {
    db: { schema: 'public' },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  expect(from).toHaveBeenCalledWith('practice_requests')
  expect(query.select).toHaveBeenCalledWith('id, location, title, priority, status')
  expect(query.order).toHaveBeenCalledWith('id', { ascending: true })
  expect(query.abortSignal).toHaveBeenCalledWith(signal)
  await expect(fetchCloudSampleRequests(signal)).rejects.toThrow('could not be loaded')
})
