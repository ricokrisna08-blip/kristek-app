-- Push notification: tabel penyimpanan token/subscription per device, dipakai
-- Edge Function "send-push-notification" (dipicu Database Webhook saat ada
-- row baru masuk ke public.notifikasi) buat tahu ke mana push dikirim.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  platform text not null check (platform in ('expo', 'web')),
  expo_push_token text,
  web_endpoint text,
  web_p256dh text,
  web_auth text,
  created_at timestamptz not null default now()
);

-- Unique per TOKEN (bukan per user+token) -- kalau device yang sama dipakai
-- login user lain, subscription-nya harus pindah tangan ke user yang login
-- sekarang (upsert onConflict token), bukan numpuk jadi 2 baris beda user
-- yang sama-sama dapat push ke device yang sama.
create unique index if not exists push_subscriptions_expo_token_key
  on public.push_subscriptions (expo_push_token)
  where platform = 'expo';

create unique index if not exists push_subscriptions_web_endpoint_key
  on public.push_subscriptions (web_endpoint)
  where platform = 'web';

alter table public.push_subscriptions enable row level security;

create policy "users manage own push subscriptions"
  on public.push_subscriptions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
