export async function fetchPhotoBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}
