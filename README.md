# Maintenance Board

A small React + Vite project in plain JavaScript for exploring maintenance request state.

## Live demo
https://maintenance-board-three.vercel.app/

The demo starts with fictional requests when no saved value exists. Requests and status changes are saved only in this browser; there is no account or device sync.

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
npm run test     # Run focused storage and React flow tests
npm run preview  # Preview the built app locally
```

## How state works

`src/App.jsx` owns the requests and storage error together in state, plus the selected request ID and active filter. It derives the selected request, filtered list, and unresolved count from the same array. The count includes every Open and In progress request, regardless of the filter.

`RequestList` receives filtered requests, the selected ID, and an `onSelect` callback through props. `RequestDetails` receives the derived selected request and an `onStatusChange` callback. The callback updates the array immutably in `App`; React renders both children with the new props. No second copy of a selected request is stored.

`NewRequestForm` owns its draft fields and validation messages. On submission, it trims text and rejects empty or whitespace-only required fields without clearing the draft. It passes valid values to `App` through the `onAddRequest` callback prop. `App` assigns a numeric ID above the largest loaded ID (or an unused positive ID if the safe integer limit is reached), sets status to Open, and attempts to save the updated array. Only after a successful save does it update the board, switch the filter to All, and select the new ID. The existing calculation updates the unresolved count automatically.

The callback returns `{ ok, error }` to the form. A successful result clears the draft, resets priority to Medium, and shows confirmation. A failed result keeps every draft field, shows an error, and leaves the board, filter, and selection unchanged.

A selected request stays open in the details when it falls outside the filter, with a notice explaining why. On mobile, details appear below the list.

## Browser storage

`src/requestStorage.js` uses the localStorage key `maintenance-board-requests-v1`. Loading happens in `App`'s lazy state initializer when it mounts. It does not write data during loading or rendering. React StrictMode may call the initializer twice during development; both calls only read.

Only a missing key loads `initialRequests`. A saved empty array stays empty. Each saved record must have a unique positive safe-integer ID, nonblank string location/title, a string description (which may be empty), and an allowed status and priority. Invalid JSON or records show an error and an empty board while preserving the original stored value. Unavailable storage also shows an error rather than falling back to fictional requests.

Saving happens synchronously on each valid form submission or status change, before updating React state. The existing stored value is checked again before writing, so malformed data introduced after loading is also preserved. If storage is blocked or full, the change is not applied and the user can retry. To recover malformed data, back up the original value in browser developer tools and repair or remove this key, then reload. The app never automatically deletes it.

## Current limitations

- Starts with three fictional requests; you can add demo requests, but cannot delete them. No real property data is included.
- Requests persist in this browser for this site origin. Clearing browser data removes them; private browsing may remove them when the session ends. Different ports or domains have separate storage.
- No login, database, account/device sync, AI calls, paid services, or backend.
- No live synchronization between open tabs. Avoid editing in multiple tabs at once: a later save can replace another tab's changes.
- Form drafts, selected request, and filter are not persisted. On reload the filter is All and the first saved request is selected, if any.

## Manual checks

- Submit blank and whitespace-only required fields: errors appear, focus moves to the first invalid field, the draft stays intact, and no request is added.
- Submit padded text with an empty description: stored text is trimmed, priority defaults to Medium, and the new request starts Open.
- Add a request while filtering Resolved: the filter switches to All, the new request is selected in both panels, the unresolved count increases, and the form clears.
- Add several requests with different priorities, then change their statuses: IDs stay distinct and stable, and the list, details, filters, and count update together.
- Reload after adding a request and changing its status: saved requests and statuses return with the correct unresolved count.
- Set the storage key to `[]` in developer tools and reload: the board stays empty and adding a request works.
- Back up the key, then set invalid JSON or duplicate IDs: reload and attempt an edit to verify the original value stays untouched and the error is clear.
- Block browser storage or simulate a quota error: submission keeps the draft with no success confirmation, and failed status edits keep the prior status. Restore storage and retry.
- Use only the keyboard and check a narrow mobile viewport for labels, focus indicators, validation, and layout. Verify behavior in a real browser and private browsing; automated tests use jsdom rather than a full browser.
