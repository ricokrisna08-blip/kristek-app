-- Validasi perpindahan status Tiket di DATABASE, bukan cuma di client.
--
-- Sebelumnya aturan state machine (src/tiket/stateMachine/applyTiketEvent.ts)
-- dan syarat foto/checklist bukti cuma dicek di app. RLS "teknisi can update
-- assigned tiket status" cuma melarang status 'dibatalkan', jadi Teknisi yang
-- ditugaskan secara teori bisa langsung update status = 'selesai' lewat API
-- tanpa foto/checklist.
--
-- Trigger ini mencerminkan aturan yang sama dengan applyTiketEvent.ts +
-- instalasiEvidence.ts. Karena dicek di BEFORE UPDATE (baris sudah ter-lock,
-- OLD = versi terbaru), dua aksi yang barengan (mis. Admin batalkan sementara
-- Teknisi End) juga tidak bisa saling timpa -- yang kedua akan ditolak karena
-- perpindahannya sudah tidak valid dari status terbaru.
--
-- Client TIDAK perlu diubah: urutan di startTiket/endTiket/endTiketWithEvidence
-- sudah insert tiket_foto dulu, baru update status.
--
-- Cuma berlaku untuk request user (auth.role() = 'authenticated').
-- service_role (Edge Functions) dan SQL Editor (postgres) tetap bebas, supaya
-- perbaikan data manual masih bisa dilakukan.
--
-- Catatan: syarat "catatan wajib diisi" untuk Pending TIDAK bisa dicek di sini
-- karena catatannya disimpan di tiket_status_log setelah update.

create or replace function public.tiket_has_foto(p_tiket_id uuid, p_types text[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  -- true kalau SEMUA type di p_types sudah ada fotonya
  select coalesce(
    (
      select count(distinct tf.type) = cardinality(p_types)
      from public.tiket_foto tf
      where tf.tiket_id = p_tiket_id and tf.type = any (p_types)
    ),
    false
  );
$$;

create or replace function public.enforce_tiket_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'ditugaskan' then
      raise exception 'Tiket baru harus berstatus Ditugaskan.'
        using errcode = 'check_violation', hint = 'tiket_status_transition';
    end if;
    return new;
  end if;

  -- Update kolom lain (mis. evidence_lokasi_*) tanpa ganti status: lewat.
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'dikerjakan' and old.status = 'ditugaskan' then
    if not public.tiket_has_foto(new.id, array['before']) then
      raise exception 'Foto "before" wajib diunggah sebelum menekan Start.'
        using errcode = 'check_violation', hint = 'tiket_status_transition';
    end if;

  elsif new.status = 'pending' and old.status = 'dikerjakan' then
    null;

  elsif new.status = 'dikerjakan' and old.status = 'pending' then
    null;

  elsif new.status = 'selesai' and old.status = 'dikerjakan' then
    if new.jenis in ('instalasi', 'gangguan_komplain') then
      if not public.tiket_has_foto(new.id, array['redaman', 'ont', 'kabel_jalur'])
         or new.evidence_lokasi_latitude is null then
        raise exception 'Checklist bukti belum lengkap (Foto Redaman, Foto ONT, Foto Kabel & Jalur, Lokasi rumah pelanggan).'
          using errcode = 'check_violation', hint = 'tiket_status_transition';
      end if;
    elsif not public.tiket_has_foto(new.id, array['after']) then
      raise exception 'Foto "after" wajib diunggah sebelum menekan End.'
        using errcode = 'check_violation', hint = 'tiket_status_transition';
    end if;

  elsif new.status = 'dibatalkan' and old.status not in ('selesai', 'dibatalkan') then
    null;

  else
    raise exception 'Perpindahan status Tiket dari % ke % tidak diizinkan.', old.status, new.status
      using errcode = 'check_violation', hint = 'tiket_status_transition';
  end if;

  return new;
end;
$$;

drop trigger if exists tiket_status_transition_guard on public.tiket;

create trigger tiket_status_transition_guard
  before insert or update of status on public.tiket
  for each row
  execute function public.enforce_tiket_status_transition();
