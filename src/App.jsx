import { useState } from 'react'
import { statuses } from './requests.js'
import { loadRequests, nextRequestId, saveRequests } from './requestStorage.js'
import RequestList from './RequestList.jsx'
import RequestDetails from './RequestDetails.jsx'
import NewRequestForm from './NewRequestForm.jsx'

export default function App() {
  const [board, setBoard] = useState(loadRequests)
  const { requests, error: storageError } = board
  const [selectedId, setSelectedId] = useState(() => requests[0]?.id ?? null)
  const [filter, setFilter] = useState('All')

  // Derive everything from the same requests array; never store a second copy.
  const selectedRequest = requests.find((request) => request.id === selectedId)
  const visibleRequests = requests.filter(
    (request) => filter === 'All' || request.status === filter,
  )
  const unresolvedCount = requests.filter((request) => request.status !== 'Resolved').length
  const selectionHidden = selectedRequest && filter !== 'All' && selectedRequest.status !== filter

  function persistRequests(nextRequests) {
    const result = saveRequests(nextRequests)
    if (result.ok) {
      setBoard({ requests: nextRequests, error: '' })
    } else {
      setBoard((currentBoard) => ({ ...currentBoard, error: result.error }))
    }
    return result
  }

  function changeStatus(id, status) {
    persistRequests(requests.map((request) => (
      request.id === id ? { ...request, status } : request
    )))
  }

  function addRequest(values) {
    const newRequest = { ...values, id: nextRequestId(requests), status: 'Open' }
    const result = persistRequests([...requests, newRequest])
    if (!result.ok) return result
    setFilter('All')
    setSelectedId(newRequest.id)
    return result
  }

  return (
    <main className="app">
      <header className="page-header">
        <div>
          <p className="eyebrow">PROPERTY CARE / DEMO</p>
          <h1>Maintenance Board<span className="brand-dot">.</span></h1>
          <p className="intro">A little clarity for the things that need fixing.</p>
        </div>
        <div className="count-card" role="status">
          <strong>{unresolvedCount}</strong>
          <span>Unresolved requests<small>Open + In progress · all requests</small></span>
        </div>
      </header>

      <p className="demo-note"><strong>Saved in this browser only.</strong> Requests and status changes are saved locally when storage is available. There is no account or device sync. Clearing browser data removes saved requests.</p>
      {storageError && <p className="storage-error" role="alert">{storageError}</p>}

      <NewRequestForm onAddRequest={addRequest} />

      <section className="workspace" aria-label="Maintenance requests">
        <div className="list-panel">
          <div className="panel-heading">
            <h2>Requests</h2>
            <span className="total">{requests.length} total</span>
          </div>
          <div className="filters" role="group" aria-label="Filter requests by status">
            {['All', ...statuses].map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={filter === status}
                onClick={() => setFilter(status)}
              >{status}</button>
            ))}
          </div>
          <RequestList requests={visibleRequests} selectedId={selectedId} onSelect={setSelectedId} />
          <p className="list-footer">{visibleRequests.length} of {requests.length} requests shown</p>
        </div>
        <RequestDetails request={selectedRequest} onStatusChange={changeStatus} selectionHidden={selectionHidden} />
      </section>
      <footer className="page-footer">Maintenance Board <span>Small fixes. Better spaces.</span></footer>
    </main>
  )
}
