import { createClient } from '@supabase/supabase-js'

let client

function getClient() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) {
    throw new Error('Cloud samples are not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart the dev server.')
  }
  if (!key.startsWith('sb_publishable_')) {
    throw new Error('Cloud samples require a Supabase publishable key (sb_publishable_…). Check VITE_SUPABASE_PUBLISHABLE_KEY; secret and service-role keys must never be used here.')
  }
  if (!client) {
    try {
      client = createClient(url, key, {
        db: { schema: 'public' },
        // This section has no login and must not store or reuse auth sessions.
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    } catch {
      throw new Error('Cloud samples could not connect. Check VITE_SUPABASE_URL and the publishable key in .env.local, then restart the dev server.')
    }
  }
  return client
}

export async function fetchCloudSampleRequests(signal) {
  const { data, error } = await getClient()
    .from('practice_requests')
    .select('id, location, title, priority, status')
    .order('id', { ascending: true })
    .abortSignal(signal)

  if (error) {
    throw new Error('Cloud samples could not be loaded. Check your connection, Supabase configuration, and read access to public.practice_requests, then retry. Your local board is unaffected.')
  }
  return data ?? []
}
