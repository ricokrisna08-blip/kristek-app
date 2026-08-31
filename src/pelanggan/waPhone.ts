export function buildWhatsappUrl(phone: string): string {
  const digits = (phone ?? "")
    .replace(/\D/g, "")
    .replace(/^0+/, "")
    .replace(/^62/, "62");

  const normalized = digits.startsWith("62") ? digits : `62${digits}`;

  return `https://wa.me/${normalized}`;
}
