# API contract · Academic Advising Portal (v1.1)

This is the agreement between the frontend (React, owner: Vinh) and the backend (FastAPI, owner: [backend owner]).
The frontend is already built against these shapes using a mock. If the backend returns exactly these shapes, switching
`VITE_USE_MOCK=false` connects the two with no frontend changes.

Machine-readable version: [`openapi.yaml`](./openapi.yaml). If this file and `openapi.yaml` disagree, fix both in the same PR.

## General rules

| Rule | Detail |
| --- | --- |
| Base path | All endpoints live under `/api`. Dev backend runs on `http://localhost:8000`; the Vite dev server proxies `/api` to it. |
| Format | JSON in and out, UTF-8, `snake_case` field names. |
| CORS | Allow `http://localhost:5173` (Vite dev) and `http://localhost:4173` (Vite preview). |
| Privacy | Requests never contain a name, email or student ID. Do not log request bodies to disk. Keep any session data in memory only (Team & Project Plan, APP 3 & 6). |
| Latency target | `POST /api/chat` and `POST /api/recommend` respond in under 3 s at p95. The frontend times out at 15 s. |
| Errors | Any non-2xx response uses the error shape below. |

### Error shape

```json
{ "error": { "code": "CURRICULUM_CYCLE", "message": "A circular prerequisite was found in the curriculum data.", "details": { "cycle": ["COS30018", "COS30019", "COS30018"] } } }
```

| HTTP | `code` | When | What the UI shows |
| --- | --- | --- | --- |
| 404 | `UNKNOWN_MAJOR` | `major` id does not exist | System error banner |
| 409 | `CURRICULUM_CYCLE` | NetworkX cycle check fails (Risk 4). `details.cycle` = list of unit codes forming the cycle | "Curriculum data error" state (S6) |
| 422 | `UNKNOWN_UNIT` | A code in `completed_units` is not in the catalogue. `details.units` = the bad codes | System error banner |
| 422 | `VALIDATION_ERROR` | Missing or malformed field, empty question | System error banner |
| 503 | `SERVICE_UNAVAILABLE` | RAG model, vector store or graph not ready | "Something went wrong on our side" + Try again (S6) |
| 500 | `INTERNAL_ERROR` | Anything else | Same as 503 |

FastAPI's default 422 body (`{"detail": [...]}`) is not this shape. Add an exception handler that converts it.

## Endpoints

### `GET /api/health`

```json
{ "status": "ok", "version": "0.1.0", "engines": { "rag": "ok", "dag": "ok" } }
```

### `GET /api/majors`

The 3–4 in-scope computing majors.

```json
{ "majors": [ { "id": "artificial-intelligence", "name": "Artificial Intelligence" } ] }
```

`id` is a stable slug. The frontend sends it back in other requests.

### `GET /api/units?major={id}`

Units shown in the "Completed units" checklist for that major (foundation units + major units).

```json
{ "units": [ { "code": "COS10009", "name": "Introduction to Programming", "credit_points": 12.5 } ] }
```

### `POST /api/recommend` · Engine 1 (DAG, Thinh)

Returns the recommended units for the student's major (the "career tag" in Jira 3.1.2), ordered into semesters and ranked inside each semester.

Ranking rule (deterministic, so the team can explain every result):

1. Between semesters, order comes from prerequisites: a unit only appears after all its prerequisites are completed or placed in an earlier semester.
2. Inside a semester, the unit that unlocks more later units of the major ranks higher. "Unlocks" = number of remaining required units that depend on it directly or indirectly (`len(nx.descendants(G, unit) & remaining_units)` in NetworkX).
3. Ties keep the order of the major's course structure in the curriculum data.
4. When more units are eligible than fit in a semester (2 per semester in the current mock), the higher-ranked ones are placed and the rest move to a later semester or to `blocked_units`.

Request:

```json
{ "major": "artificial-intelligence", "completed_units": ["COS10009", "COS10004", "MAT10004", "COS20015"] }
```

Response 200:

```json
{
  "major": { "id": "artificial-intelligence", "name": "Artificial Intelligence" },
  "semesters": [
    { "index": 1, "name": "Semester 1", "credit_points": 25.0,
      "units": [
        { "code": "COS20007", "name": "Object Oriented Programming", "credit_points": 12.5, "rank": 1, "reason": "unlocks 5 later units" },
        { "code": "COS20019", "name": "Cloud Computing Architecture", "credit_points": 12.5, "rank": 2, "reason": "required for your major" }
      ] }
  ],
  "blocked_units": [
    { "code": "COS30049", "name": "Computing Technology Innovation Project", "credit_points": 12.5,
      "missing_prereqs": ["COS30008", "COS30019"], "available_after": "Semester 2" }
  ],
  "violations": 0,
  "completed_units": ["COS10009", "COS10004", "MAT10004", "COS20015"]
}
```

| Field | Rule |
| --- | --- |
| `semesters[].units` | Every prerequisite of a unit is either in `completed_units` or in an earlier semester. The array is sorted by `rank` (first element = `rank` 1). |
| `rank` | Integer starting at 1 in each semester. Shown as the "#1", "#2" badge on the unit card. |
| `reason` | Short lowercase phrase shown after the credit points, e.g. `unlocks 5 later units` or `required for your major`. |
| `blocked_units` | Required units that are not in the returned semesters. `missing_prereqs` = prerequisites not yet completed. `available_after` = name of the semester in which the last missing prerequisite is planned, or `null` if it is not planned. |
| `violations` | Count of prerequisite rule breaks in the returned plan. Must be `0` (NFR: 0.0% PVR). If it is ever above 0 the UI shows a red "check failed" banner. |
| Empty plan | All units done → `semesters: []`, `blocked_units: []`. |

### `POST /api/chat` · Engine 2 (RAG, Minh Huy)

Request:

```json
{ "question": "What do I need to pass COS30019?", "history": [ { "role": "user", "content": "..." }, { "role": "assistant", "content": "..." } ] }
```

`history` is optional (previous turns of this session, oldest first). `question` is 1–500 characters.

Response 200, answered:

```json
{
  "answer": "You need an overall mark of at least 50% and must complete the hurdle task described in the unit outline [1].",
  "citations": [
    { "id": "chunk_0142", "doc": "COS30019 Unit Outline", "section": "§4 Assessment", "page": 6,
      "snippet": "…to pass this unit students must achieve an overall mark of 50% or more…", "similarity": 0.86,
      "url": "https://…/COS30019-unit-outline.pdf" }
  ],
  "abstained": false,
  "abstain_reason": null,
  "top_similarity": 0.86,
  "threshold": 0.70,
  "sources_checked": 5,
  "sources_passed": 1,
  "latency_ms": 1180
}
```

Response 200, abstained (Risk 3, threshold gate):

```json
{
  "answer": null,
  "citations": [],
  "abstained": true,
  "abstain_reason": "LOW_SIMILARITY",
  "top_similarity": 0.41,
  "threshold": 0.70,
  "sources_checked": 5,
  "sources_passed": 0,
  "latency_ms": 640
}
```

| Field | Rule |
| --- | --- |
| `abstained` | `true` when no retrieved chunk reaches `threshold`. Then `answer` is `null` and `citations` is `[]`. Never return a generated answer with `abstained: true`. |
| `abstain_reason` | `LOW_SIMILARITY` (nothing close enough) or `OUT_OF_SCOPE` (topic outside the portal, e.g. cross-institution credit transfer). `null` when answered. |
| `citations` | Only chunks that were actually retrieved and passed the threshold. `id` is the chunk id in ChromaDB, so the team can trace each answer during evaluation. |
| `[n]` markers | `[1]` in `answer` refers to `citations[0]`, `[2]` to `citations[1]`, and so on. |
| `page` | Integer, or `null` when the source has no page numbers. |
| `url` | Link to the full source document, or `null`. Drives the "Open full document" button; the button is disabled when `null`. |
| `similarity`, `top_similarity`, `threshold` | Cosine similarity, 0–1, two decimals is enough. |
| `latency_ms` | Server-side time for the request. Used for the latency evaluation. |

Abstention is a 200 response. Use the error shape only when something failed.

### `GET /api/trends`

Major-trend summaries from the approved WEF and Stack Overflow reports, built with the same RAG pipeline and the same citation rules.

```json
{
  "trends": [
    { "major": { "id": "artificial-intelligence", "name": "Artificial Intelligence" },
      "summary": "AI and data skills are reported among the fastest-growing skill groups.",
      "citations": [ { "id": "chunk_0901", "doc": "WEF Future of Jobs Report", "section": "Skills outlook", "page": 34, "snippet": "…", "similarity": 0.78 } ] }
  ]
}
```
