// Pesan dari trigger tiket_status_transition_guard (lihat migration
// 20261025010000) sudah ramah user, jadi diteruskan apa adanya. Error
// Postgres lain tetap pakai pesan fallback supaya detail teknis tidak bocor
// ke layar.
const TRANSITION_HINT = "tiket_status_transition";

export function statusTransitionErrorMessage(
  error: { message?: string; hint?: string | null } | null | undefined,
  fallback: string
): string {
  if (error?.hint === TRANSITION_HINT && error.message) {
    return error.message;
  }
  return fallback;
}
