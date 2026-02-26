# ADR 010 Rationale: Time-Related Requirements Inventory

> **Rationale log for [ADR 010 — Time and Scheduling Architecture](../010_time_and_scheduling_architecture.md)**
> This document catalogs the raw requirements that motivated ADR 010. It is preserved as an analytical artifact; the normative decisions are in the ADR itself.

Based on the platform specifications, here is a comprehensive list of all time-related requirements, constraints, and behaviors:

## 1. Live Event & Phase Timers (Ch.14)
- **Pitch Phase Timer**: Default duration is 5 minutes.
- **Coding Sprint Timer**: Configurable duration (e.g., 90 minutes). Warning displayed at 15 minutes remaining.
- **Review Phase Timer**: Optional, often unlimited.
- **Timer Visuals**: Escalation as time runs low (color change at 25% remaining, animation at 10% remaining).
- **Audio Cues**: Optional (user preference) beep at 1 minute remaining and at exactly 0:00 (expiry).
- **Auto-Closure Mechanism (Ch.14.5.1.1)**: Timers are evaluated *lazily on read*. If `event_live_context` is queried and `timer_ends_at` is in the past, the system automatically creates a `closed` decision before returning the context.

## 2. Real-Time Chat & Collaboration (Ch.31)
- **Polling Intervals**:
  - Active event (in progress): **3 seconds**
  - No active event / idle platform: **10 seconds**
  - User idle (tab not visible): **paused completely** (Page Visibility API); immediate catch-up poll on return (see ADR 008)
- **Message Editing**: Messages can only be edited within **15 minutes** of creation.
- **Message Grouping**: Consecutive messages from the same user within **2 minutes** are grouped together visually (avatar only on the first).
- **Team Presence (Heartbeat)**: 
  - Client sends a heartbeat every **15 seconds** when the tab is visible.
  - User is considered "online" if their last heartbeat was within **30 seconds**.
  - (Future) Typing indicators expire after **3 seconds** of no keystrokes.
- **Last Active Timestamps**:
  - `< 1 minute` = "just now"
  - `1-59 minutes` = "{N}m ago"
  - `1-23 hours` = "{N}h ago"
  - `1-7 days` = "{N}d ago"
  - `> 7 days` = "inactive"

## 3. Registrations & Waitlist (Ch.29, Ch.30)
- **Waitlist Invitation Window**: When a spot opens up, the invited user has exactly **24 hours** to respond (`waitlist_expires_at`). If no response within 24 hours, the invitation expires and moves to the next person.

## 4. Security, Auth, & Sessions (Ch.18, Ch.19)
- **Email Confirmation**: Magic links / OTPs for email confirmation have a **24-hour validity** (`email_confirm_expires_at`).
- **Session Lifetime**: 
  - Standard browser session expires on close.
  - "Remember me" functionality sets expiration to **30 days**.
  - Absolute maximum session lifetime is **90 days** from creation, regardless of activity.

## 5. UI & Auto-Save (Ch.25, Ch.26)
- **Draft Auto-Save**: Forms (like problem creation or long content) auto-save every **30 seconds** to local storage.
- **Draft Expiry**: Local storage drafts expire after **7 days**.
- **Toast Notifications**: Have configurable durations before automatically dismissing themselves.
