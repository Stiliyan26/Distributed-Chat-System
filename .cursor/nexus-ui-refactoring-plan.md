# Nexus UI (`nexus-ui`) — Refactoring Plan

This document lives under `.cursor/` so agents and humans can align on scope, order, and architectural intent. Target stack: **React + Vite + Tailwind**, TanStack Query, Socket.IO, axios.

**Non-goals (per product owner):** CSS nitpicks, memo micro-opts, unit tests, a11y deep-dive, SSR/SEO.

---

## 1. Current state (snapshot)

| Area | Status |
|------|--------|
| **Size** | ~32–35 source files under `src/`, ~2.3k lines TS/TSX (excluding assets) |
| **API** | Shared `api/axios.ts` (base URL, credentials, refresh interceptor); thin `api/*.ts` modules |
| **Types** | Centralized `types/index.ts` |
| **Global state** | `AuthProvider`, `SocketProvider`, `ThemeProvider` + thin `use*` hooks |
| **Server cache** | React Query in `App.tsx`; used in `ChatPage`, `Sidebar`, `ChannelDetails`, modals |
| **Largest files** | `ChatPage.tsx` (~267 LOC), `RegisterPage` / `ChannelDetails` (~196), `CreateChannelModal` (~191), `Sidebar` (~175) |

### Known architectural pressure points

1. **`ChatPage`** — orchestrates channel selection, modals, messages (RQ + local merge), unread/preview maps, socket subscription, scroll, header UI.
2. **Channel list + socket joins** — `getUserChannels` / `join_all_user_channels` touched from `SocketProvider` (on connect, `joinAllChannels`) and `Sidebar` (`useQuery` + `useEffect` + `joinChannels`). Risk of drift or duplicate policy.
3. **Theme** — `main.tsx` applies initial theme to `documentElement`; `ThemeProvider` reads same storage and applies on toggle. Two initialization paths to keep consistent.
4. **Error handling** — Login/Register use ad-hoc `err` casts; `AddMemberModal` uses `axios.isAxiosError` + helper. Unify.
5. **Debounced user search** — Nearly duplicated in `CreateChannelModal` and `AddMemberModal`.
6. **Modal / spinner / inline error** — Repeated markup across auth pages and modals.
7. **Loose ends** — `typingUser` in `ChatPage` may be half-wired; `sendMessageRest` may be unused vs socket send; `EmptyChat` uses `document.querySelector('textarea')` instead of a ref from the composer owner.
8. **`lib/utils.ts`** — Mixes presentation helpers (`formatDate`, initials) with chat domain (`mergeChatMessages`, fingerprints). Consider splitting for clearer boundaries.

---

## 2. Target folder structure (choose one)

### Option A — Layered (simple navigation)

```text
src/
  app/                 # router shells, provider composition (optional extract from App.tsx)
  api/                 # keep or alias as services/
  types/
  hooks/               # useChannels, useChatMessages, useDebouncedUserSearch, …
  lib/                 # pure helpers; optionally lib/chat/ vs lib/format/
  context/
  components/
    ui/                # Modal, Spinner, InlineAlert, …
    layout/
    chat/
    channel/
  pages/
```

### Option B — Feature-based (scales with domains)

```text
src/
  app/
  api/
  shared/              # ui/, hooks/, lib/, types as needed
  features/
    auth/
    chat/
    channels/
```

**Decision to record:** Which layout matches how the repo will grow (more features vs more shared design system)?

---

## 3. Refactoring phases and order

Work **cross-cutting extractions before** splitting large components, so logic moves once.

### Phase 1 — Big picture (done when agreed)

- [ ] Confirm folder option (A vs B) and naming (`hooks/` vs `features/*/hooks`).
- [ ] Prioritize roadmap items below (pick 2–3 first).

### Phase 2 — Cross-cutting extractions

| # | Task | Outcome |
|---|------|---------|
| 2.1 | **API error normalization** | One helper (e.g. `getApiErrorMessage(err: unknown): string`) used by Login, Register, mutations, modals. |
| 2.2 | **Query key factory** | e.g. `queryKeys.channels.all`, `queryKeys.messages.byChannel(id)` — single place for invalidation strings. |
| 2.3 | **Channels + socket join policy** | One documented owner: e.g. `useUserChannels()` that returns query result and encapsulates or documents when `joinChannels` / `joinAllChannels` run; reduce duplicate `getUserChannels` + emit logic between `SocketProvider` and `Sidebar`. |
| 2.4 | **Debounced user search** | `useDebouncedUserSearch(options)` or RQ-based pattern shared by `CreateChannelModal` and `AddMemberModal`. |
| 2.5 | **Chat message pipeline hook** | e.g. `useChannelMessages(channelId, { onNewMessage, sendMessage, user })` — RQ fetch + `mergeChatMessages` + socket subscription + optimistic send; `ChatPage` becomes layout + wiring. |
| 2.6 | **Shared UI primitives** | `Modal` (backdrop + panel + header), `Spinner`, `InlineAlert` — replace copy-paste. |
| 2.7 | **Types** | Move repeated shapes (e.g. channel preview `{ sender, content }`) into `types/` or domain file. |
| 2.8 | **Theme init** | Decide single source: bootstrap script / `main` only / provider only — document flash vs StrictMode behavior. |
| 2.9 | **`lib` split** (optional) | `lib/chat/message-merge.ts` vs `lib/format/date.ts` (or under `shared/`). |

### Phase 3 — Component-level refactors (after hooks exist)

Order by **size and dependency**: start with files that shrink others.

1. **`ChatPage.tsx`** — Responsibility audit: channel chrome, message list, socket effects, unread maps → mostly composition + hooks.
2. **`ChannelDetails.tsx`** — Multiple `useQuery` chains; candidate `useChannelMembersWithPresence(channelId, hints)`.
3. **`Sidebar.tsx`** — Navigation vs channel list vs join effect; align with 2.3.
4. **`CreateChannelModal` / `AddMemberModal`** — Consume 2.4 + 2.6.
5. **`LoginPage` / `RegisterPage`** — Consume 2.1 + 2.6; keep pages thin.
6. **`SocketProvider`** — Slim to transport + status; move channel-join policy if 2.3 says so.

### Phase 4 — Cleanup pass

- [ ] Remove or wire dead code (`typingUser`, `sendMessageRest` if unused).
- [ ] Replace `document.querySelector('textarea')` with ref callback or lifted ref from `MessageInput`.
- [ ] Ensure exports/imports match chosen folder structure; run `tsc` / lint.

---

## 4. Time rough order of magnitude

| Depth | Calendar / focus time (solo, mid-level) |
|-------|------------------------------------------|
| Light (2.1, 2.2, 2.4, partial 2.6) | ~1–2 days |
| Solid (+ 2.3, 2.5, slim ChatPage, lib split) | ~3–5 days focused |
| Defense-ready (+ folder migration, presence/members hooks, theme story, cleanup) | ~1–2 weeks wall-clock |

---

## 5. Open architectural questions (answer in PRs or here)

1. **Single owner of socket room membership:** Should `join_all_user_channels` be driven only from connection lifecycle, only from cached channel list changes, or from a small shared function both call? What fails if two layers both “own” it?
2. **React Query vs socket for messages:** Invalidate `['messages', id]` on `new_message` for active channel vs rely purely on local merge — trade-off: consistency vs churn/refetch.
3. **Feature folders vs layers:** Which structure will you still want in 6 months?

---

## 6. Tutor mode reminder

When pairing with an AI tutor: prefer **questions and line-range audits** over having the model rewrite the whole app unless you explicitly ask for “write it” / “fast mode.”

---

## 7. Changelog

| Date | Note |
|------|------|
| *(add as you complete phases)* | |
