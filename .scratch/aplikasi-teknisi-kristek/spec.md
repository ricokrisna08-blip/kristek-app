# Aplikasi Teknisi Internet Kristek

Status: ready-for-agent

## Problem Statement

Kristek currently has no structured way to track field technician work — installations, repair complaints, and scheduled maintenance are coordinated informally (phone/WhatsApp), which means the owner (Pemilik) has no reliable record of how long a job actually took, whether photo evidence was captured, why a job stalled, or which technicians are performing well. As Kristek plans to expand beyond its current single kelurahan, this informal process won't scale to multiple regions or a growing technician headcount.

## Solution

A single mobile app, shared by three roles (Pemilik, Admin, Teknisi), that manages the full lifecycle of a Tiket (work ticket) — creation, assignment, a shared Start/End work timer, mandatory before/after photo evidence, a Pending flow with required notes when work stalls, in-app notifications, and a performance report visible only to the Pemilik. The app works offline in the field and syncs when connectivity returns. A Wilayah (region) concept is built in from day one, even though only one region is in use today, so Kristek's planned expansion doesn't require a schema migration later.

## User Stories

1. As a Pemilik, I want to log in with a username and password, so that I can access the app securely.
2. As an Admin, I want to log in with a username and password, so that I can manage daily ticket operations.
3. As a Teknisi, I want to log in with a username and password, so that I can see and work on my assigned Tiket.
4. As a Pemilik, I want to create new Admin and Teknisi accounts (Nama, Alamat, No. Telp, Username, Password, Wilayah), so that I control exactly who has system access.
5. As a Pemilik, I want to be the only role that can create user accounts, so that account creation stays under my direct control.
6. As a Pemilik, I want to assign a Wilayah to each Admin and Teknisi account, so that their access is scoped to the region they operate in.
7. As a Pemilik, I want cross-Wilayah visibility over all Admins, Teknisi, and Tiket, so that I can oversee the whole business regardless of how many regions we expand into.
8. As an Admin, I want to create a new Pelanggan record (Nama, Alamat, No. HP, Nomor Pelanggan auto-generated), so that customer details are captured once and reused.
9. As an Admin, I want to search for an existing Pelanggan by name or Nomor Pelanggan, so that I can attach a new Tiket to their existing record instead of re-entering their details.
10. As an Admin or Pemilik, I want to see a Pelanggan's full Tiket history, so that I understand their service history at a glance.
11. As a Pemilik, I want to manage the list of Wilayah (add a new region), so that the app is ready when Kristek expands beyond its current single kelurahan.
12. As an Admin, I want to pick a Wilayah manually from a dropdown when creating a Pelanggan or Tiket, so that I control the assignment without relying on automatic address detection.
13. As an Admin, I want to create a new Tiket with a Jenis (Instalasi / Gangguan-Komplain / Maintenance), so that field work is tracked as it comes in.
13a. As an Admin, I want an Instalasi Tiket to skip the existing-Pelanggan search and instead let me fill in a brand-new Pelanggan's details (Nama, Alamat, No. HP, ODP, Paket) directly on the same form, so that I don't need a separate step for a customer who doesn't exist in the system yet.
13b. As an Admin, I want a Gangguan-Komplain Tiket to require picking an existing Pelanggan plus a required free-text Keluhan field, so that the reported problem is captured alongside who reported it.
13c. As an Admin, I want a Maintenance Tiket to skip Pelanggan entirely and instead require picking an existing ODP plus a required free-text Deskripsi Pekerjaan field, so that infrastructure work (e.g. ODP/ODC migration) that isn't tied to one customer is still tracked.
14. As an Admin, I want to assign one or more Teknisi to a Tiket, so that a job can be handled by a single technician or a team as needed.
15. As an Admin, I want a Tiket to enter the "Ditugaskan" status the moment Teknisi are assigned, so that its state reflects reality.
16. As a Teknisi, I want to receive an in-app notification when a new Tiket is assigned to me, so that I know I have new work without checking the app proactively.
17. As an Admin or Pemilik, I want to cancel a Tiket ("Dibatalkan"), so that mistaken entries or customer cancellations don't linger as open work.
18. As a Teknisi, I want to press Start on an assigned Tiket, so that the work timer begins and the Tiket moves to "Dikerjakan".
19. As a Teknisi, I want the Start/End button to be shared across the whole assigned team for a Tiket, so that any teammate present at the site can operate it.
20. As a Teknisi, I want to be required to upload a "before" photo when I press Start, so that the site condition is documented before work begins.
21. As a Teknisi, I want to be required to upload an "after" photo when I press End, so that proof of completed work is documented.
22. As a Teknisi, I want to mark a Tiket as "Pending" with a required note when I'm blocked (e.g. waiting for material), so that the delay reason is recorded.
23. As an Admin, I want to receive an in-app notification when a Tiket I assigned goes into "Pending", so that I can react quickly (e.g. arrange materials).
24. As a Pemilik, I want to receive an in-app notification when any Tiket goes into "Pending", so that I have visibility into field blockers.
25. As a Teknisi, I want to press "Lanjut" to resume a Pending Tiket, so that the work timer starts running again from where it paused.
26. As a Teknisi, I want to press End once the work is done (with the mandatory after-photo), so that the Tiket moves to "Selesai".
27. As an Admin, I want to receive an in-app notification when a Tiket I assigned is marked "Selesai", so that I know the job is done.
28. As a Pemilik, I want to receive an in-app notification when any Tiket is marked "Selesai", so that I stay informed on overall progress.
29. As a Teknisi, I want every member of the assigned team to receive equal performance credit when a Tiket is completed, so that team-based work doesn't unfairly penalize any one member.
30. As a Teknisi, I want to fill in Tiket updates (status changes, notes, photos) while offline at a job site with no signal, so that poor field connectivity doesn't block me from working.
31. As a Teknisi, I want my offline updates to sync automatically once my device regains connectivity, so that I don't have to manually resend anything.
32. As a Pemilik, I want to see, per Teknisi, the number of completed Tiket, so that I can gauge overall output.
33. As a Pemilik, I want to see, per Teknisi, the average work duration, so that I can gauge efficiency.
34. As a Pemilik, I want to see, per Teknisi, the number of times they've hit "Pending" status, so that I can spot recurring field blockers.
35. As any role, I want to see my notifications in a single in-app bell/notification list, so that I don't need to rely on email or SMS to stay informed.
36. As an Admin, I want to create an ODP record (Label, Lokasi, Wilayah) within my own Wilayah, so that field distribution points are tracked in the system.
37. As an Admin, I want to link a Pelanggan to their originating ODP when creating or editing the Pelanggan, so that the connection point is recorded once and doesn't need to be re-entered per Tiket.
38. As a Teknisi, I want to see which ODP a Tiket's Pelanggan originates from, so that I can locate the right distribution point quickly in the field.
39. As an Admin or Teknisi, I want the list of selectable ODP to be scoped to my own Wilayah, so that I don't have to search through ODP from other regions.
40. As a Pemilik, I want to create a new Paket (e.g. "15 Mbps", "30 Mbps", "50 Mbps"), so that the catalog of internet speed tiers Kristek offers is kept up to date.
41. As a Pemilik, I want to be the only role that can create a Paket, so that the shared, cross-Wilayah product catalog stays under my direct control (same posture as Wilayah and user accounts).
42. As an Admin, I want to pick a Paket from the existing catalog when creating a Pelanggan, so that their subscribed speed tier is recorded.
43. As an Admin or Pemilik, I want a Pelanggan's Paket to show on their detail view, so that I know which speed tier they're subscribed to without cross-referencing elsewhere.

## Implementation Decisions

- Mobile app built with React Native (Expo), single codebase for Android/iOS.
- Backend: Supabase (Postgres + Auth + Storage).
- Auth: all roles log in with Username + Password (not email). Supabase Auth is email-based, so the implementation maps each Username to an internal synthetic email (e.g. `{username}@internal.kristek.app`) under the hood; the UI never exposes email to the user.
- Core seam: a standalone **Tiket State Machine** module, pure and framework-agnostic, encapsulating:
  - Valid status transitions: `Baru → Ditugaskan → Dikerjakan → Pending ⇄ Dikerjakan → Selesai`, or `→ Dibatalkan` from any non-terminal status, restricted to Admin/Pemilik.
  - Required-field validation per transition: before-photo required to enter `Dikerjakan` via Start; note required to enter `Pending`; after-photo required to enter `Selesai` via End.
  - Work-duration accumulation across `Dikerjakan`/`Pending` cycles (time in `Pending` excluded).
  - Equal performance-credit distribution across all assigned Teknisi when a Tiket reaches `Selesai`.
  - This module has no I/O — it takes the current Tiket state plus an event and returns the new state or a validation error.
- Conceptual schema (not final DDL):
  - `users`: id, nama, alamat, no_telp, username, password_hash, role (`pemilik`\|`admin`\|`teknisi`), wilayah_id (nullable for pemilik)
  - `wilayah`: id, nama
  - `pelanggan`: id, nama, alamat, no_hp, nomor_pelanggan (unique, auto-generated), wilayah_id, odp_id, paket_id (nullable)
  - `odp`: id, label (unique), lokasi, wilayah_id
  - `paket`: id, nama (unique) — a single shared catalog, not Wilayah-scoped, unlike `odp`
  - `tiket`: id, jenis (`instalasi`\|`gangguan_komplain`\|`maintenance`), pelanggan_id (nullable — absent for `maintenance`), odp_id (nullable — only set for `maintenance`), keluhan (nullable text — only for `gangguan_komplain`), deskripsi_pekerjaan (nullable text — only for `maintenance`), wilayah_id, status, created_by (admin user id), started_at, ended_at, accumulated_pending_seconds, notes (separate from keluhan/deskripsi_pekerjaan — this is the Pending-reason field from ticket 08), dibatalkan_by (nullable)
  - `tiket_teknisi`: join table (tiket_id, teknisi_id) — supports many-to-many for team assignment
  - `tiket_foto`: id, tiket_id, type (`before`\|`after`), url, uploaded_by, uploaded_at
  - `notifikasi`: id, user_id, tiket_id, type (`ditugaskan`\|`pending`\|`selesai`), read_at, created_at
- Photo storage: Supabase Storage, referenced by URL in `tiket_foto`.
- Notifications: in-app only, delivered via a Supabase Realtime subscription to the `notifikasi` table — no email/SMS integration.
- Offline strategy: a local-first write queue on-device for Tiket status changes, notes, and photo captures, flushed to Supabase by a sync worker once connectivity returns. Conflict-resolution strategy is not yet decided (see Out of Scope).
- Access scoping: Admin and Teknisi queries are filtered by their `wilayah_id`; Pemilik queries are unscoped.

## Testing Decisions

- Prioritize testing the Tiket State Machine module in complete isolation as pure unit tests: every valid transition, every invalid transition (e.g. End without an after-photo, Pending without a note, Start attempted by an unassigned Teknisi), and duration accumulation across multiple Pending cycles.
- Only test external behavior of the state machine — inputs are the current state plus an event and its payload, outputs are the new state or a validation error — not internal helper functions.
- This is a greenfield repo with no prior test-suite art to follow; the state machine module should be the first test-driven piece of code written (see the `tdd` skill for the red-green-refactor loop once implementation starts).
- Supabase-backed integration tests (schema constraints, Wilayah-based row-level security) come after the state machine is solid — out of scope for the first implementation pass.

## Out of Scope

- Offline conflict-resolution strategy (two devices editing the same Tiket while both offline) — needs a follow-up decision before the sync worker is built.
- SLA target thresholds — explicitly rejected; Durasi Kerja (work duration) is tracked with no target/breach concept.
- Email or SMS notifications — explicitly rejected in favor of in-app-only notifications.
- Customer-facing access — Pelanggan has no login or self-service view.
- Paket pricing/description — only the name (speed tier) is tracked for now.
- Detailed report UI/visualizations beyond the three listed metrics (jumlah selesai, rata-rata durasi, jumlah pending).
- Individual (per-Teknisi) Start/End timers — explicitly rejected in favor of one shared team timer (see ADR-0002).
- Billing, invoicing, or payment functionality.
- ODP port capacity (jumlah slot terpakai/tersedia) — bisa ditambahkan nanti kalau relevan buat perencanaan jaringan.
- ODC (Optical Distribution Cabinet) as a modeled entity — Maintenance Tiket only reference an existing ODP plus a free-text Deskripsi Pekerjaan; ODC/migration work is described in that free text, not tracked as its own structured entity yet.

## Further Notes

- See `CONTEXT.md` for the full domain glossary (Tiket, Pelanggan, Wilayah, Bukti Foto, status vocabulary) and `docs/adr/0001-model-wilayah-from-the-start.md` / `docs/adr/0002-shared-start-end-timer-for-team-assignments.md` for the two recorded architectural trade-offs.
- The React Native + Supabase stack and the username-via-synthetic-email auth workaround were proposed during this spec's seam-confirmation step (lighter-weight than the domain grilling session) — flag early in implementation if either turns out to be a poor fit.
- A follow-up spec should cover the offline conflict-resolution strategy once the state machine and basic online flow are proven out.
