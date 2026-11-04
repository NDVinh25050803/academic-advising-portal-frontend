# Academic Advising Portal · Frontend (v1.1)

React + Vite implementation of the Figma design v1.1 (screens S1–S6). Owner: Vinh.

## Run

```bash
npm install
cp .env.example .env      # VITE_USE_MOCK=true by default
npm run dev               # http://localhost:5173
```

With `VITE_USE_MOCK=true` every API call is answered by `src/api/mock.js` (sample data, no backend needed).
Set `VITE_USE_MOCK=false` to call the FastAPI backend on `http://localhost:8000` through the Vite proxy
(`BACKEND_URL=http://host:port npm run dev` to change the target). The recommendation endpoint is `POST /api/recommend` (Jira 3.1.3).

Demo switches for the S6 states (mock mode only): add `?mock=down` (service error) or `?mock=cycle`
(curriculum data error) before the `#`, for example `http://localhost:5173/?mock=cycle#pathway`.

## Backend contract

`docs/API_CONTRACT.md` (rules + examples) and `docs/openapi.yaml` (machine-readable). Hand both to the backend owner.
`src/api/client.js` has one function per endpoint; nothing else in the app calls `fetch`.

## Figma → code map

| Figma | Code |
| --- | --- |
| Variables (Semantic, Dimensions) | `src/styles/tokens.css` (same names, e.g. `--color-bg-brand`) |
| Text styles | `.t-display`, `.t-h1`, `.t-h2`, `.t-body`, `.t-small`, `.t-label`, `.t-caption` in `src/styles/app.css` |
| Button · Type | `components/Button.jsx` `variant="primary|secondary|ghost|warning"` |
| MajorChip, CitationChip | `components/Chips.jsx` |
| UnitSelect · Checked | `components/UnitSelect.jsx` (real checkbox) |
| UnitCard · Status, Rank | `components/UnitCard.jsx` `status="planned|completed|blocked"`, `rank` shows the #n badge |
| Banner · Tone | `components/Banner.jsx` `tone="success|warning|danger|info"` |
| App/TopBar + App/Sidebar | `components/Shell.jsx` |
| S1 Study profile | `pages/ProfilePage.jsx` |
| S2 Pathway | `pages/PathwayPage.jsx` |
| S3 grounded chat, S4 abstention | `pages/ChatPage.jsx` |
| S5 Major trends | `pages/TrendsPage.jsx` |
| S6 system states | `components/States.jsx` + empty/loading states inside each page |

## Added beyond Figma v1.1

- Visible keyboard focus ring on every interactive element (WCAG 2.4.7); hover states on buttons and chips.
- Responsive layout: sidebar becomes a scrollable top nav below 760 px; source panel moves under the chat below 1100 px.
- `aria-live` on the chat thread and unit counter; `prefers-reduced-motion` respected.

## Privacy

No name, email or student ID is collected. Profile and chat history live in React state only and are gone when the tab closes.
Nothing is written to localStorage or cookies.

## Known limits

- All data in `mock.js` is sample data (unit codes, prerequisites, passages, trend claims).
- Answers are not streamed yet; see "Not in v1.1" in the contract.
