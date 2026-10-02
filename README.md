# Maintenance Board

A small React + Vite project in plain JavaScript for exploring maintenance request state.

## Live demo
https://maintenance-board-three.vercel.app/

Demo uses fictional requests. Status changes reset on refresh.

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

A selected request stays open in the details when it falls outside the filter, with a notice explaining why. On mobile, details appear below the list.

## Current limitations

- Three fictional requests; no creation, deletion, or real property data.
- Temporary React state only: refreshing resets all changes.
- No login, database, persistence, AI calls, paid services, or backend.
- Status updates happen locally and are not shared across tabs or users.
