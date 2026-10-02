# Maintenance Board

A small React + Vite project in plain JavaScript for exploring maintenance request state.

## Live demo
https://maintenance-board-three.vercel.app/

Demo uses fictional requests. New requests and status changes reset on refresh.

## Run locally

Use Node.js 22.12+ (Node 22 LTS) and npm. From this folder:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

```sh
npm run lint     # Check JavaScript and React rules
npm run build    # Produce the production app in dist/
npm run preview  # Preview the built app locally
```

## How state works

`src/App.jsx` owns the requests array, selected request ID, and active filter with `useState`. It derives the selected request, filtered list, and unresolved count from the same array. The count includes every Open and In progress request, regardless of the filter.

`RequestList` receives filtered requests, the selected ID, and an `onSelect` callback through props. `RequestDetails` receives the derived selected request and an `onStatusChange` callback. The callback updates the array immutably in `App`; React renders both children with the new props. No second copy of a selected request is stored.

`NewRequestForm` owns its draft fields and validation messages. On submission, it trims text and rejects empty or whitespace-only required fields without clearing the draft. It passes valid values to `App` through the `onAddRequest` callback prop, then clears the form and resets priority to Medium. `App` assigns a sequential numeric ID (using `useRef` to keep it stable and unique within this temporary session), sets status to Open, appends the request, switches the filter to All, and selects the new ID. The existing calculation updates the unresolved count automatically.

A selected request stays open in the details when it falls outside the filter, with a notice explaining why. On mobile, details appear below the list.

## Current limitations

- Starts with three fictional requests; you can add demo requests, but cannot delete them. No real property data is included.
- Temporary React state only: refreshing resets all changes.
- No login, database, persistence, AI calls, paid services, or backend.
- Status updates happen locally and are not shared across tabs or users.

## Manual checks

- Submit blank and whitespace-only required fields: errors appear, focus moves to the first invalid field, the draft stays intact, and no request is added.
- Submit padded text with an empty description: stored text is trimmed, priority defaults to Medium, and the new request starts Open.
- Add a request while filtering Resolved: the filter switches to All, the new request is selected in both panels, the unresolved count increases, and the form clears.
- Add several requests with different priorities, then change their statuses: IDs stay distinct and stable, and the list, details, filters, and count update together.
- Use only the keyboard and check a narrow mobile viewport for labels, focus indicators, validation, and layout. Refresh to confirm the demo resets.
