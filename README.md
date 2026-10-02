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

## Cloud sample setup

The separate read-only **Cloud sample requests** section fetches fictional Supabase records. It does not write to the database or merge records into the local board or count.

1. Copy `.env.example` to `.env.local` if that file does not already exist. Preserve any existing values.
2. Set `VITE_SUPABASE_URL` to your project URL and `VITE_SUPABASE_PUBLISHABLE_KEY` to its `sb_publishable_…` key. Get these from Supabase's Connect dialog. Never use a secret or service-role key. Vite exposes these two values to the browser.
3. The existing `public.practice_requests` table must allow reads with the publishable key and contain `id`, `location`, `title`, `priority`, and `status`. No description column is queried. This app does not create the table or change permissions/schema.
4. Restart `npm run dev` after editing configuration. For deployment, set the same environment variables before building.

`.env.local` is ignored by Git through `*.local`. Missing or invalid configuration shows a helpful error without affecting the local board. Loading, empty results, errors, and Retry are handled within the cloud section.

`src/supabase.js` creates the client with auth-session persistence disabled and queries exactly those five columns, ordered by `id` ascending. `src/CloudSampleRequests.jsx` owns the fetch state, displays the records, and retries reads. It cancels requests on cleanup to ignore stale results. See [Supabase's publishable-key documentation](https://supabase.com/docs/guides/getting-started/api-keys).

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
- No login, account/device sync, AI calls, or database writes. The cloud sample section requires an existing Supabase project; local board data stays in browser storage.
- No live synchronization between open tabs. Avoid editing in multiple tabs at once: a later save can replace another tab's changes.
- Form drafts, selected request, and filter are not persisted. On reload the filter is All and the first saved request is selected, if any.

## Manual checks

- Check that Supabase records load in ID order, with no description or edit controls. Confirm the local count and saved requests remain unchanged.
- Check an empty cloud result, offline/error behavior followed by Retry, and missing configuration after restarting the server. Verify the local board still works in each case.

- Submit blank and whitespace-only required fields: errors appear, focus moves to the first invalid field, the draft stays intact, and no request is added.
- Submit padded text with an empty description: stored text is trimmed, priority defaults to Medium, and the new request starts Open.
- Add a request while filtering Resolved: the filter switches to All, the new request is selected in both panels, the unresolved count increases, and the form clears.
- Add several requests with different priorities, then change their statuses: IDs stay distinct and stable, and the list, details, filters, and count update together.
- Reload after adding a request and changing its status: saved requests and statuses return with the correct unresolved count.
- Set the storage key to `[]` in developer tools and reload: the board stays empty and adding a request works.
- Back up the key, then set invalid JSON or duplicate IDs: reload and attempt an edit to verify the original value stays untouched and the error is clear.
- Block browser storage or simulate a quota error: submission keeps the draft with no success confirmation, and failed status edits keep the prior status. Restore storage and retry.
- Use only the keyboard and check a narrow mobile viewport for labels, focus indicators, validation, and layout. Verify behavior in a real browser and private browsing; automated tests use jsdom rather than a full browser.
