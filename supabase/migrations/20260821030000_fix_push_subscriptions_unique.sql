-- Partial unique index (where platform = 'expo'/'web') ternyata tidak
-- kompatibel dengan mekanisme upsert PostgREST/supabase-js -- .upsert(...,
-- { onConflict: "expo_push_token" }) menghasilkan `ON CONFLICT
-- (expo_push_token)` tanpa predicate WHERE, yang tidak match partial index,
-- error "there is no unique or exclusion constraint matching the ON
-- CONFLICT specification" (42P10). Ini bikin SEMUA upsert push_subscriptions
-- gagal senyap sejak awal (di-catch di client, tidak pernah keliatan).
--
-- Ganti ke unique constraint biasa (bukan partial) -- aman karena NULL
-- dianggap berbeda satu sama lain di Postgres, jadi baris platform='web'
-- (expo_push_token selalu NULL) tidak akan saling bentrok gara-gara sama-
-- sama NULL, dan begitu juga sebaliknya untuk web_endpoint di baris
-- platform='expo'.

drop index if exists public.push_subscriptions_expo_token_key;
drop index if exists public.push_subscriptions_web_endpoint_key;

alter table public.push_subscriptions
  add constraint push_subscriptions_expo_token_key unique (expo_push_token);

alter table public.push_subscriptions
  add constraint push_subscriptions_web_endpoint_key unique (web_endpoint);
