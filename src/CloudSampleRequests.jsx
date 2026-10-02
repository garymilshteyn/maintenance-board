import { useEffect, useState } from 'react'
import { fetchCloudSampleRequests } from './supabase.js'

export default function CloudSampleRequests() {
  const [result, setResult] = useState({ status: 'loading', requests: [], error: '' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const requests = await fetchCloudSampleRequests(controller.signal)
        if (!controller.signal.aborted) setResult({ status: 'ready', requests, error: '' })
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ status: 'error', requests: [], error: error.message || 'Cloud samples could not be loaded. Check your connection and retry.' })
        }
      }
    }

    load()
    // Ignore old responses after unmounting or starting a different attempt.
    return () => controller.abort()
  }, [attempt])

  function retry() {
    setResult({ status: 'loading', requests: [], error: '' })
    setAttempt((currentAttempt) => currentAttempt + 1)
  }

  return (
    <section className="cloud-panel" aria-labelledby="cloud-heading" aria-busy={result.status === 'loading'}>
      <div className="panel-heading">
        <h2 id="cloud-heading">Cloud sample requests</h2>
        <span className="total">Read only</span>
      </div>
      <p className="cloud-note">These fictional records come from Supabase. They are separate from your browser’s saved requests and unresolved count.</p>

      {result.status === 'loading' && <p role="status">Loading cloud sample requests…</p>}
      {result.status === 'error' && <p className="field-error" role="alert">{result.error}</p>}
      {result.status === 'ready' && result.requests.length === 0 && <p role="status">No cloud sample requests are available.</p>}
      {result.status === 'ready' && result.requests.length > 0 && (
        <ul className="cloud-list">
          {result.requests.map((request) => (
            <li className="cloud-card" key={request.id}>
              <div className="card-top"><span className="location">{request.location}</span><span className="request-number">#{request.id}</span></div>
              <h3 className="request-title">{request.title}</h3>
              <div className="card-bottom">
                <span className="status-badge" data-status={request.status}>{request.status}</span>
                <span className="priority" data-priority={request.priority}>{request.priority} priority</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {(result.status === 'error' || (result.status === 'ready' && result.requests.length === 0)) && (
        <button type="button" className="cloud-retry" onClick={retry}>Retry</button>
      )}
    </section>
  )
}
