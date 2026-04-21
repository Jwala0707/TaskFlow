# AI Agent Guidance for TaskFlow

This file constrains how AI agents (Kiro, Claude, Copilot, etc.) should contribute to this codebase.

---

## Principles

1. **Minimal surface area** — generate only what is needed. No speculative abstractions.
2. **Fail loudly** — prefer explicit errors over silent fallbacks.
3. **Types everywhere** — all Python functions must have type hints; all TypeScript must be strict-mode compliant.
4. **No magic** — avoid metaprogramming, dynamic attribute access, or patterns that obscure intent.

---

## Backend (Python / Flask)

### Do
- Use marshmallow schemas for ALL input validation — never trust raw `request.json`
- Use `db.get_or_404()` for single-record fetches
- Return consistent JSON envelopes: `{"project": {...}}` or `{"projects": [...]}`
- Log unexpected exceptions via the `logging` module before returning 500
- Use `abort(403)` for authorization failures, `abort(404)` for missing resources

### Don't
- Don't add business logic inside route handlers — extract to service functions if logic grows
- Don't expose internal exception messages to the client
- Don't use `db.session.query(Model)` — prefer `Model.query` for consistency
- Don't commit partial state — always commit once at the end of a mutation

### Error format
All errors must follow:
```json
{ "error": "Human-readable message", "status": 422, "details": {} }
```

---

## Frontend (React / TypeScript)

### Do
- Use React Query for all server state — no manual `useEffect` + `useState` for fetches
- Use Zustand only for client-side auth state
- Keep components small — if a component exceeds ~100 lines, split it
- Use semantic HTML elements and ARIA labels on interactive elements
- Handle loading and error states explicitly in every page component

### Don't
- Don't call `api` directly from components — use custom hooks in `src/hooks/`
- Don't store sensitive data (tokens) in `sessionStorage` or cookies without `httpOnly`
- Don't use `any` type — use `unknown` and narrow it
- Don't mutate React Query cache directly except in optimistic updates

---

## Testing

- Every new API endpoint needs at least: happy path, validation failure, auth failure
- Frontend component tests must cover: render, user interaction, edge cases
- Tests must not share state — use fixtures and teardown
- Do not mock the database in backend tests — use SQLite in-memory

---

## What AI should NOT do

- Do not generate migration files — run `flask db migrate` manually
- Do not add dependencies without updating `requirements.txt` or `package.json`
- Do not generate `.env` files with real secrets
- Do not add console.log or print statements to production code paths
