# ADR 001: Database Engine Strategy

## Status

**Accepted** (2026-01-28, refined 2026-02-24)

## Context

The platform requires a relational SQL database for its append-only event-sourced data model. Key requirements:

- Immutable, append-only tables (decisions, responses, assessments)
- Controlled vocabularies with extensibility (no schema migrations for new values)
- Multi-location community with UUID-based primary keys (mergeable across locations)
- Development environment must be lightweight and file-copyable for backup
- Production environment must handle concurrent multi-user access during live events

The platform specification (Chapters 00-33) is intentionally **engine-agnostic** — it describes SQL schemas without depending on vendor-specific features.

## Decision

### Dual-Engine Strategy

- **Development**: SQLite via `better-sqlite3` (Node.js binding)
- **Production**: PostgreSQL

The same SQL schema runs on both engines. Application code does not use engine-specific features.

### UUID Primary Keys

All primary keys use UUID (or UUID-compatible TEXT in SQLite):

- Opaque identifiers — no information leakage from sequential IDs
- Mergeable across locations without auto-increment coordination
- Generated application-side, not by the database engine

### VARCHAR + FK Reference Tables (No Enums)

All controlled vocabularies (decision types, readiness states, action states, time contexts, roles, etc.) are implemented as **reference tables with VARCHAR primary keys** rather than database-engine-specific enum types.

**Rationale** (from Ch.25 interview, Q7):
- SQLite has no native enum support; VARCHAR+FK works identically on both engines
- Adding new vocabulary values requires only an INSERT, not a schema migration
- Matches the Item Key pattern used throughout the domain model

## Consequences

### Positive

- **Portable schema**: Same `.sql` files work on SQLite and PostgreSQL
- **Easy dev setup**: SQLite database is a single file; backup = file copy (Ch.25 interview, Q6)
- **No migration overhead**: New catalog values added via INSERT statements
- **Location mergeability**: UUID keys allow cross-location data consolidation

### Negative

- **No PostgreSQL-specific features**: Cannot use JSONB, array types, native enums, or advanced indexing
- **Concurrency limitations in dev**: SQLite has limited concurrent write support (acceptable for single-developer use)
- **ORM must support both**: Database access layer must generate compatible SQL for both engines (Drizzle or Kysely — ORM choice still open)

### Constraints on Schema Design

- All DDL must use standard SQL types (TEXT, INTEGER, BOOLEAN, TIMESTAMP, UUID/TEXT)
- No `CREATE TYPE` or `CREATE ENUM` statements
- Foreign keys reference VARCHAR primary keys in catalog tables
- Application-level validation for catalog membership (defense in depth with FK constraints)

## References

- Platform Spec Chapter 19: Data Model and Persistence
- Platform Spec Chapter 25: Interview Findings (Q6: SQLite backup, Q7: VARCHAR+FK over enums)
