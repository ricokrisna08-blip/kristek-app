import { buildWhatsappUrl } from "../waPhone";

test("normalizes local Indonesian mobile numbers to WhatsApp format", () => {
  expect(buildWhatsappUrl("081234567890")).toBe("https://wa.me/6281234567890");
  expect(buildWhatsappUrl("+62 812-3456-7890")).toBe("https://wa.me/6281234567890");
});

test("returns a safe URL for already normalized numbers", () => {
  expect(buildWhatsappUrl("6281234567890")).toBe("https://wa.me/6281234567890");
});
