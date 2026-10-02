export default function RequestList({ requests, selectedId, onSelect }) {
  if (requests.length === 0) {
    return <p className="empty-state">No requests match this filter. Choose another status to see more.</p>
  }

  return (
    <ul className="request-list">
      {requests.map((request) => (
        <li key={request.id}>
          <button
            type="button"
            className="request-card"
            aria-pressed={selectedId === request.id}
            aria-controls="request-details"
            onClick={() => onSelect(request.id)}
          >
            <span className="card-top"><span className="location">{request.location}</span><span className="request-number">#{String(request.id).padStart(3, '0')}</span></span>
            <span className="request-title">{request.title}</span>
            <span className="card-bottom">
              <span className="status-badge" data-status={request.status}>{request.status}</span>
              <span className="priority" data-priority={request.priority}>{request.priority} priority</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
