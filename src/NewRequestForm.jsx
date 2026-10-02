import { useState } from 'react'

const emptyFields = { location: '', title: '', description: '', priority: 'Medium' }

export default function NewRequestForm({ onAddRequest }) {
  const [fields, setFields] = useState(emptyFields)
  const [errors, setErrors] = useState({})
  const [confirmation, setConfirmation] = useState('')

  function changeField(event) {
    const { name, value } = event.target
    setFields((currentFields) => ({ ...currentFields, [name]: value }))
    setErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }))
    setConfirmation('')
  }

  function submitRequest(event) {
    event.preventDefault()
    const values = {
      location: fields.location.trim(),
      title: fields.title.trim(),
      description: fields.description.trim(),
      priority: fields.priority,
    }
    const validationErrors = {}
    if (!values.location) validationErrors.location = 'Enter a room or location.'
    if (!values.title) validationErrors.title = 'Enter a problem title.'
    setErrors(validationErrors)
    setConfirmation('')

    if (validationErrors.location || validationErrors.title) {
      const firstInvalidField = validationErrors.location ? 'location' : 'title'
      event.currentTarget.elements.namedItem(firstInvalidField).focus()
      return
    }

    // App owns the requests. Only clear the draft after its callback succeeds.
    onAddRequest(values)
    setFields(emptyFields)
    setConfirmation('Request added as Open and selected below.')
  }

  return (
    <section className="new-request-panel" aria-labelledby="new-request-heading">
      <h2 id="new-request-heading">New request</h2>
      <p className="form-hint">Required fields are labeled. New requests start as Open.</p>
      <form onSubmit={submitRequest} noValidate>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="new-location">Room/location (required)</label>
            <input id="new-location" name="location" value={fields.location} onChange={changeField} required aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? 'location-error' : undefined} />
            {errors.location && <p id="location-error" className="field-error" role="alert">{errors.location}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="new-title">Problem title (required)</label>
            <input id="new-title" name="title" value={fields.title} onChange={changeField} required aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'title-error' : undefined} />
            {errors.title && <p id="title-error" className="field-error" role="alert">{errors.title}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="new-description">Description (optional)</label>
            <textarea id="new-description" name="description" rows={3} value={fields.description} onChange={changeField} />
          </div>
          <div className="form-field">
            <label htmlFor="new-priority">Priority</label>
            <select id="new-priority" name="priority" value={fields.priority} onChange={changeField}>
              {['Low', 'Medium', 'High'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="add-request-button">Add request</button>
          <p className="form-confirmation" role="status">{confirmation}</p>
        </div>
      </form>
    </section>
  )
}
