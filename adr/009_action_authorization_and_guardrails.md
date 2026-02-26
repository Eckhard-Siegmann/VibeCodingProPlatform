# ADR 009: Action Authorization & Decision Guardrails

## Status

**Accepted** (2026-02-25)

## Context

The system relies heavily on **Decisions** (Ch.10) to define the state of Problems and Live Events. Tickets 5 through 8 implement the core capabilities for creating these binding decisions:
- Quality Gate (Accept/Reject/Defer)
- Event Queue Planning
- Live Pitch Open/Close

We need a consistent architectural pattern within SvelteKit to enforce *who* can make these decisions and *how* the resulting state changes are atomically guaranteed in the database, ensuring that malformed requests or unauthorized actors cannot bypass the system's strict lifecycle rules (Ch.27).

## Decision

We will implement a **Centralized Decision Dispatcher** pattern within the repository layer, heavily guarding the SvelteKit Server Actions.

### 1. The Decision Dispatcher (`repositories/decisions.ts`)

All state-mutating actions must route through a single, heavily validated repository function: `recordDecision()`

```typescript
async function recordDecision(
  tx: PrismaTransaction, // Always requires a transaction context
  problemId: string,
  actorUserId: string,
  decisionTypeKey: string, // FK to decision_type_catalog
  rationale?: string,
  isBinding: boolean = true
): Promise<void>
```

This function is the **only** piece of code allowed to update `problems.current_readiness_state` and `problems.current_action_state`. It does so by looking up the transition mapping in the `decision_state_effects` table dynamically, rather than hardcoding state updates.

### 2. Authorization at the Action Boundary

SvelteKit Server Actions (`+page.server.ts`) will never perform direct database mutations. They act purely as Authorization and Validation gateways before delegating to the repository layer.

Every Server Action must implement a strict, three-step guardrail:
1. **Authentication Check**: Verify `locals.user` exists.
2. **Authorization Scope Check**: 
   - Verify `locals.user.role` against required roles (e.g., `moderator`, `admin`).
   - For PO actions (like archiving), verify `locals.user.user_id` matches `problems.created_by_user_id` or `deputy_owner_user_id`.
3. **State Validity Check**: Verify the target Problem or Event is in a state that accepts the requested decision (e.g., cannot 'Accept' a problem that is already 'Closed').

### 3. Atomic Transactions

To prevent race conditions (especially important during Live Event Mode changes where multiple moderators might click "Start Pitch" simultaneously), the entire cycle must be wrapped in a transaction:

1. Read current state
2. Validate transition
3. Insert Decision record
4. Update Problem cached state OR `event_live_context`
5. Commit

### 4. No Implicit State Derivation

As mandated by Ch.10, the system must never infer state from secondary data. For example, a Problem's state does not become 'Selected for Coding' simply because users joined a team. It only enters that state if a Moderator explicitly records the `selected_for_coding` decision.

## Consequences

### Positive
- **Auditability Guarantee**: It is impossible to change a Problem's state without leaving a traceable Decision log.
- **Security**: Centralized authorization prevents API parameter tampering from triggering unauthorized state transitions.
- **Maintainability**: New decision types or states can be added to the catalog tables without changing backend code logic.

### Negative
- **Verbosity**: Simple state changes require more robust boilerplate (Auth Check -> Transaction -> Decision Insert -> Update).
- **Performance Overhead**: Requires reading from catalog tables/state effect mappings during transitions, though these can be heavily cached.

## References
- Platform Spec Ch.10. Decisions and Decision History
- Platform Spec Ch.19. Data Model and Persistence
- Platform Spec Ch.27. Appendix: Problem State Transitions
