// expo-file-system tidak punya implementasi web sama sekali -- import
// statis di top-level bikin seluruh app crash saat dibuka lewat browser,
// bukan cuma fitur yang pakai ini. Makanya di-import dinamis, cuma
// dievaluasi saat benar-benar dipanggil (Teknisi memang hanya memakai HP,
// bukan web, jadi fungsi ini juga tidak pernah dipanggil di web).
export async function persistCapturedPhoto(
  sourceUri: string,
  filename: string
): Promise<string> {
  const { File, Paths } = await import("expo-file-system");
  const sourceFile = new File(sourceUri);
  const destination = new File(Paths.document, filename);
  await sourceFile.copy(destination);
  return destination.uri;
}
