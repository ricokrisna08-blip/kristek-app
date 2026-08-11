# Modul Billing & Tagihan Pelanggan (kristek-app)

Status: ready-for-agent

## Problem Statement

Kristek tracks customer billing — who's on which package, what they owe, who's paid, monthly revenue — entirely by hand in a Google Sheet, separate from the Pelanggan/Paket data already managed in kristek-app for field operations. The spreadsheet has grown from 70 to 130 Pelanggan over the last year, and pricing already varies per Pelanggan (subsidized/negotiated rates exist even within the same Paket tier), which makes manual tracking increasingly error-prone. Reminder messaging (kristek-wa-blast) reads from a manually re-exported CSV rather than a live source of truth, and financial-report visibility (who owes what, total collected) isn't separated from day-to-day payment bookkeeping the way the business actually wants it separated.

## Solution

A new billing module inside the existing kristek-app, visible to Admin (records payments) and Pemilik (records payments plus sees aggregate financial reports) — not a new app, and not merged with kristek-web (public marketing site, stays separate) or kristek-wa-blast (stays a separate manual tool for now).

This is **Phase 1** of billing: per-Pelanggan monthly tracking only — a price attached to each Pelanggan and a monthly Tagihan record with a simple Sudah Bayar/Belum Bayar status. Business-level financial reporting (biaya operasional, Modal, Investor split — the parts of the current spreadsheet that go beyond individual customer billing) is explicitly **Phase 2**, specced separately later.

Tagihan generation for the month is a manual, explicit action (button in-app, backed by a Supabase Edge Function) rather than an automatic recurring job — paired with an in-app reminder notification at the start of each cycle so the manual step doesn't get missed. This deliberately does not carry over the standalone Python script previously used for this kind of task; the generation logic is small enough to live in the same TypeScript/Supabase stack as the rest of the app.

Billing access is centralized: unlike Tiket/Pelanggan/ODP, Admin's Tagihan access is **not** scoped by Wilayah. This is a conscious, temporary deviation from the Wilayah-scoping pattern — see `docs/adr/0003-billing-access-centralized-not-wilayah-scoped.md`.

Rollout runs in parallel with the existing spreadsheet for one full billing cycle (one month) before the spreadsheet is retired for the scope covered by Phase 1.

## User Stories

1. As an Admin, I want to set a Pelanggan's harga langganan (defaults empty, not inherited from Paket), so that per-customer pricing — including existing subsidi/nego rates — is captured accurately.
2. As an Admin, I want to edit a Pelanggan's harga langganan later if it changes, so that price renegotiations are reflected going forward.
3. As an Admin or Pemilik, I want to trigger "Generate Tagihan" for the current period with one action, so that a Tagihan record is created for every active Pelanggan without manually creating 130+ records by hand.
4. As an Admin or Pemilik, I want generating Tagihan for a period I've already generated to be a no-op (not create duplicates), so that an accidental double-trigger doesn't double-bill anyone.
5. As an Admin or Pemilik, I want an in-app notification at the start of each billing cycle reminding me to generate that period's Tagihan, so that the manual step doesn't get forgotten.
6. As an Admin, I want to mark a Pelanggan's Tagihan for the current period as "Sudah Bayar" (or leave it "Belum Bayar"), so that payment status reflects reality as customers pay.
7. As an Admin, I want to see the list of the current period's Tagihan across all Wilayah, so that I can track and follow up on payments centrally.
8. As an Admin, I want to filter/search the Tagihan list by Pelanggan name or by status (Sudah/Belum Bayar), so that I can quickly find who still owes.
9. As a Pemilik, I want an aggregate report per period — total omset, total Sudah Bayar, total Belum Bayar, percentage paid — so that I can track collection performance without opening individual records.
10. As a Pemilik, I want that aggregate report visible only to my role, so that business-level financial totals aren't exposed to Admin or Teknisi.
11. As a Teknisi, I have no access to Tagihan or pricing data anywhere in the app, so that financial information stays limited to Admin and Pemilik.
12. As a Pemilik, I want existing active Pelanggan and their current-period payment status migrated once from the spreadsheet into the app, so that the module starts with accurate real data instead of empty.
13. As a Pemilik or Admin, I want this module to run alongside the existing spreadsheet for one full cycle, cross-checked manually at cycle end, so that we trust the numbers before treating the app as the sole record.

## Implementation Decisions

- New table `tagihan`: `id`, `pelanggan_id`, `periode` (e.g. `2026-09`), `jumlah` (copied from `pelanggan.harga` at generation time — a snapshot, so a later price edit doesn't retroactively change a past Tagihan), `status_bayar` (`sudah_bayar`\|`belum_bayar`), `dibayar_at` (nullable), `generated_at`, `generated_by`. Unique constraint on `(pelanggan_id, periode)` to make generation idempotent (story 4).
- `pelanggan` gains one new nullable field: `harga` (integer, per-Pelanggan). **`paket` is not touched** — it keeps only `nama` (speed tier), consistent with the existing Out-of-Scope decision in the teknisi spec ("Paket pricing/description — only the name is tracked"). No conflict with that decision: price lives on Pelanggan, not Paket.
- "Generate Tagihan" is a Supabase Edge Function (TypeScript): for the given `periode`, inserts one `tagihan` row per active Pelanggan with `harga` set, skipping any Pelanggan that already has a row for that `periode`. Invoked manually from the app by Admin or Pemilik — no cron/scheduled generation in Phase 1.
- The cycle-start reminder is a separate, lightweight scheduled job (Supabase scheduled function / pg_cron) that does nothing but insert a row into the existing `notifikasi` table on the 1st of each month — it does not itself generate Tagihan. Reuses the existing in-app notification infrastructure (bell icon, Realtime subscription) built for Tiket notifications; add a new `type`: `tagihan_reminder`.
- Access scoping: `tagihan` and `pelanggan.harga` queries are **not** filtered by `wilayah_id` for Admin — unscoped/centralized, same visibility as Pemilik. This is a deliberate departure from the Wilayah-scoping pattern used for `tiket`/`pelanggan` (base fields)/`odp`; see ADR-0003.
- Aggregate report (story 9) reads from `tagihan` filtered by `periode`, computing sums/percentages server-side or client-side from the Tagihan list — no new denormalized table needed at this scale (~130 Pelanggan).
- Migration: one-time, manual import of active Pelanggan (`harga` field) plus a `tagihan` row for the current in-progress period reflecting their current spreadsheet status. Historical periods (Okt-25 through the cutover month) are **not** migrated — they stay archived in the spreadsheet.
- kristek-wa-blast is untouched in Phase 1: it keeps reading its manually exported CSV. Wiring it to read `tagihan` directly is a follow-up, not part of this spec.

## Testing Decisions

- Prioritize testing the Tagihan-generation function's idempotency: calling it twice for the same `periode` must not create duplicate or double rows for any Pelanggan (story 4) — this is the one place a bug directly corrupts money-tracking data.
- Test the aggregate report's arithmetic (total omset, sudah/belum bayar counts, percentage) against a known fixture set of Tagihan rows.
- Access-scoping tests: confirm Admin can read/write `tagihan` across Wilayah (not just their own), and that Teknisi has zero access to `tagihan` or `pelanggan.harga` at the query/policy level (Supabase RLS), not just hidden in the UI.

## Out of Scope

- Auto-isolir (automatically suspending network access for Belum Bayar Pelanggan) — planned by the Pemilik as a later addition, but needs its own spec since it crosses into network/router infrastructure, a different domain than the rest of this app.
- Laporan keuangan bisnis: biaya operasional (listrik, Biznet, gaji, dst.), Modal, Investor split — Phase 2, specced separately.
- Automatic/recurring Tagihan generation (a scheduled job that generates Tagihan itself, not just a reminder) — Phase 1 keeps generation an explicit manual action.
- Partial payments or installment tracking — `status_bayar` is binary (Sudah/Belum Bayar) only, matching the current spreadsheet's model.
- Automatic WA reminder integration from `tagihan` data — kristek-wa-blast stays a manually-fed separate tool for Phase 1.
- Full historical billing data migration (the spreadsheet's Okt-25 through present history) — only the active Pelanggan and current-period status are migrated; older history stays in the spreadsheet as archive.
- Wilayah-scoped billing access — deliberately not built; revisit if/when the centralized-access trade-off in ADR-0003 stops holding.

## Further Notes

- This spec assumes the existing teknisi-app core (12 issues in `.scratch/aplikasi-teknisi-kristek/`) is finished and stable first — this billing module is sequenced to start after that, not interleaved with it, so it doesn't collide with in-flight decisions about `pelanggan`/`paket`.
- See `docs/adr/0003-billing-access-centralized-not-wilayah-scoped.md` for the Wilayah-scoping trade-off, and `CONTEXT.md` for the existing domain glossary (Pelanggan, Paket, Wilayah) this spec builds on. New domain terms this spec introduces (Tagihan, Periode, Status Bayar, Harga Langganan) should be added to `CONTEXT.md` when implementation starts.
- A follow-up spec should cover Phase 2 (laporan keuangan bisnis) once Phase 1 has run its parallel-validation cycle and is trusted as the source of truth.
- A follow-up spec should cover auto-isolir once Phase 1 is stable, since it touches both this module and the Tiket domain (likely a new Maintenance-adjacent Tiket type or a new automated trigger).
