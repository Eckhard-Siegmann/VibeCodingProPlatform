# ADR 008: Real-Time Data Synchronization Strategy

## Status

**Accepted** (2026-02-25)

## Context

The platform requires real-time or near-real-time updates for three primary features defined in the specifications:
1. **Live Event Orchestration** (Ch.14): "What's Happening Now" banners, countdown timers, and phase transitions (Pitch, Review, Idle).
2. **Team Chat** (Ch.31): Real-time messaging between participants, threaded discussions, and system activity posts.
3. **Team Presence** (Ch.31.15): Status indicators showing who is currently online and viewing a problem card.

The core technology stack (ADR 002) is SvelteKit backed by SQLite via Prisma. We must choose a synchronization strategy that balances immediate user feedback with the operational constraints of a stateless, potentially multi-instance backend deployment, avoiding unnecessary infrastructure complexity (e.g., Redis, dedicated WebSocket servers) for the MVP.

## Decision

We will implement **Adaptive Client-Side Polling** as the exclusive mechanism for real-time synchronization, specifically rejecting WebSockets or Server-Sent Events (SSE) for the initial MVP.

### Polling Strategy & Intervals

As defined in Ch.31.9, the client will adjust its polling frequency based on the current context to minimize server load while providing responsive feedback during active phases:

1. **Active Event Context (3 seconds)**
   - Used when the user is viewing an event that is currently ongoing (`starts_at` <= now <= `planned_ends_at`) or when `event_live_context.current_mode` is not 'idle'.
   - Polling queries narrow scopes: `chat_messages` (only checking for `major_version` and `created_at` > last poll), `event_live_context`, and team presence.

2. **Inactive Event Context (10 seconds)**
   - Used when viewing problems or events outside of their scheduled live windows.

3. **Background/Idle Context (Paused)**
   - When the Page Visibility API reports `document.hidden === true` (user switched tabs or minimized), all data polling is **completely paused** — no requests are made while the tab is hidden.
   - Presence heartbeats (§Ephemeral Presence below) are also paused.
   - Upon returning (`visibilitychange` event), an immediate "catch-up" poll is fired to synchronize state.
   - **Note**: This supersedes earlier spec drafts (Ch.31.9) that mentioned a 30-second idle interval. Full pause is preferred because it eliminates unnecessary server load from background tabs and the catch-up poll provides instant recovery.

### Optimistic UI Updates

To ensure the interface feels instantaneously responsive to the acting user:
- Chat messages, team joins, and moderator actions are immediately rendered in the UI with a pending state.
- The UI state is reconciled (and the pending state cleared) upon successful response from the server action.
- Errors during submission revert the optimistic update and display a toast notification.

### Ephemeral Presence (Heartbeats)

Per Ch.31.15.5, team presence will not use the SQLite database to avoid high-volume write thrashing:
- Clients send a lightweight heartbeat POST request every 15 seconds.
- The server maintains presence in a simple application-layer, in-memory cache (e.g., a standard Map or LRU cache).
- Read requests for presence simply query this memory structure.
- *Note on scaling*: In a multi-node deployment, this would require Redis. For the current single-instance Svelte Node server MVP, an in-memory Map is sufficient and zero-config.

## Consequences

### Positive
- **Architectural Simplicity**: No WebSocket connection management, no pub/sub infrastructure (Redis), no connection drop/reconnect complex logic.
- **Stateless Backend**: The SvelteKit server functions remain entirely stateless Request/Response handlers.
- **Easy Deployment**: Runs cleanly on any standard serverless or containerized host without requiring long-lived connection support.

### Negative
- **Latency**: Up to 3 seconds of delay between a message being sent and received by others during live events.
- **Server Load**: 50 concurrent users at an event will generate ~16 requests per second (RPS) during active phases. SQLite and Node can handle this trivially, but it is less efficient than pushed updates.

## References
- Platform Spec Ch.14. Live Interaction Modes
- Platform Spec Ch.31. Team Chat and Collaboration
- ADR 002: Frontend Technology Stack
