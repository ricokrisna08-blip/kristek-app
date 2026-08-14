-- Antrian job blast WhatsApp (tagihan/marketing/apology). Pemilik trigger
-- lewat app (insert baris "pending"), daemon Playwright yang jalan di
-- laptop (folder terpisah kristek-wa-blast, login pakai akun khusus
-- "System WA Blast" role Pemilik) polling tabel ini, proses satu-satu,
-- update progress-nya biar keliatan live di app.
create table if not exists public.wa_blast_job (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'billing' check (mode in ('billing', 'marketing', 'apology')),
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  requested_by uuid not null references public.users (id),
  total int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

alter table public.wa_blast_job enable row level security;

create policy "admin and pemilik can read wa blast job"
  on public.wa_blast_job for select
  to authenticated
  using (public.current_user_role() in ('admin', 'pemilik'));

create policy "pemilik can insert wa blast job"
  on public.wa_blast_job for insert
  to authenticated
  with check (
    public.current_user_role() = 'pemilik'
    and requested_by = auth.uid()
  );

-- Update dipakai daemon buat lapor progress (sent_count/failed_count/
-- status) -- daemon login sebagai akun role Pemilik juga, jadi policy-nya
-- sama dengan yang boleh trigger.
create policy "admin and pemilik can update wa blast job"
  on public.wa_blast_job for update
  to authenticated
  using (public.current_user_role() in ('admin', 'pemilik'));
