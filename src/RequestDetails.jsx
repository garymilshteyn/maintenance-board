import { statuses } from './requests.js'

export default function RequestDetails({ request, onStatusChange, selectionHidden }) {
  return (
    <section id="request-details" className="details-panel" aria-labelledby="details-heading">
      <div className="panel-heading">
        <h2 id="details-heading">Request details</h2>
        {request && <span className="total">#{String(request.id).padStart(3, '0')}</span>}
      </div>
      {request ? (
        <>
          <div className="detail-summary">
            <p className="location">{request.location}</p>
            <h3>{request.title}</h3>
            <span className="status-badge" data-status={request.status}>{request.status}</span>
          </div>
          <dl className="metadata">
            <div><dt>Location</dt><dd>{request.location}</dd></div>
            <div><dt>Priority</dt><dd className="priority" data-priority={request.priority}>{request.priority}</dd></div>
          </dl>
          <div className="description">
            <h4>Description</h4>
            <p>{request.description}</p>
          </div>
          <div className="status-control">
            <label htmlFor="request-status">Request status</label>
            <select id="request-status" value={request.status} onChange={(event) => onStatusChange(request.id, event.target.value)}>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <p>Changes appear immediately. No save button needed.</p>
            {selectionHidden && <p className="filter-note" role="status">This request is outside the current filter. Its details stay open so you can keep editing.</p>}
          </div>
        </>
      ) : <p className="empty-state">Select a request to view its details.</p>}
    </section>
  )
}
