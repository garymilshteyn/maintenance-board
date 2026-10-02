import { useRef, useState } from 'react'
import { initialRequests, statuses } from './requests.js'
import RequestList from './RequestList.jsx'
import RequestDetails from './RequestDetails.jsx'
import NewRequestForm from './NewRequestForm.jsx'

export default function App() {
  const [requests, setRequests] = useState(initialRequests)
  const [selectedId, setSelectedId] = useState(initialRequests[0].id)
  const [filter, setFilter] = useState('All')
  // IDs increase for this demo session and are assigned only once per request.
  const nextRequestId = useRef(Math.max(...initialRequests.map((request) => request.id)) + 1)

  // Derive everything from the same requests array; never store a second copy.
  const selectedRequest = requests.find((request) => request.id === selectedId)
  const visibleRequests = requests.filter(
    (request) => filter === 'All' || request.status === filter,
  )
  const unresolvedCount = requests.filter((request) => request.status !== 'Resolved').length
  const selectionHidden = selectedRequest && filter !== 'All' && selectedRequest.status !== filter

  function changeStatus(id, status) {
    setRequests((currentRequests) => currentRequests.map((request) => (
      request.id === id ? { ...request, status } : request
    )))
  }

  function addRequest(values) {
    const newRequest = { ...values, id: nextRequestId.current, status: 'Open' }
    nextRequestId.current += 1
    setRequests((currentRequests) => [...currentRequests, newRequest])
    setFilter('All')
    setSelectedId(newRequest.id)
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

      <p className="demo-note"><strong>Temporary demo.</strong> These requests are fictional. Changes live in React state; refreshing resets the demo.</p>

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
