import {
  canManageAccounts,
  canManageWilayah,
  canViewOdp,
  canCreateOdp,
  canViewPelanggan,
  canCreatePelanggan,
  canManagePaket,
  canCreateTiket,
  canDeleteOdp,
  canDeletePelanggan,
  canViewAllTiket,
  canViewLaporanPerforma,
} from "../permissions";

test("Pemilik can manage accounts", () => {
  expect(canManageAccounts("pemilik")).toBe(true);
});

test("Admin cannot manage accounts", () => {
  expect(canManageAccounts("admin")).toBe(false);
});

test("Teknisi cannot manage accounts", () => {
  expect(canManageAccounts("teknisi")).toBe(false);
});

test("Pemilik can manage Wilayah", () => {
  expect(canManageWilayah("pemilik")).toBe(true);
});

test("Admin cannot manage Wilayah", () => {
  expect(canManageWilayah("admin")).toBe(false);
});

test("Teknisi cannot manage Wilayah", () => {
  expect(canManageWilayah("teknisi")).toBe(false);
});

test("Pemilik can view ODP", () => {
  expect(canViewOdp("pemilik")).toBe(true);
});

test("Admin can view ODP", () => {
  expect(canViewOdp("admin")).toBe(true);
});

test("Teknisi cannot view ODP (in this ticket's screen)", () => {
  expect(canViewOdp("teknisi")).toBe(false);
});

test("Admin can create ODP", () => {
  expect(canCreateOdp("admin")).toBe(true);
});

test("Pemilik can create ODP", () => {
  expect(canCreateOdp("pemilik")).toBe(true);
});

test("Teknisi cannot create ODP", () => {
  expect(canCreateOdp("teknisi")).toBe(false);
});

test("Pemilik can view Pelanggan", () => {
  expect(canViewPelanggan("pemilik")).toBe(true);
});

test("Admin can view Pelanggan", () => {
  expect(canViewPelanggan("admin")).toBe(true);
});

test("Teknisi cannot view Pelanggan (in this ticket's screen)", () => {
  expect(canViewPelanggan("teknisi")).toBe(false);
});

test("Admin can create Pelanggan", () => {
  expect(canCreatePelanggan("admin")).toBe(true);
});

test("Pemilik cannot create Pelanggan", () => {
  expect(canCreatePelanggan("pemilik")).toBe(false);
});

test("Teknisi cannot create Pelanggan", () => {
  expect(canCreatePelanggan("teknisi")).toBe(false);
});

test("Pemilik can manage Paket", () => {
  expect(canManagePaket("pemilik")).toBe(true);
});

test("Admin cannot manage Paket", () => {
  expect(canManagePaket("admin")).toBe(false);
});

test("Teknisi cannot manage Paket", () => {
  expect(canManagePaket("teknisi")).toBe(false);
});

test("Admin can create Tiket", () => {
  expect(canCreateTiket("admin")).toBe(true);
});

test("Pemilik cannot create Tiket", () => {
  expect(canCreateTiket("pemilik")).toBe(false);
});

test("Teknisi cannot create Tiket", () => {
  expect(canCreateTiket("teknisi")).toBe(false);
});

test("Pemilik can delete ODP", () => {
  expect(canDeleteOdp("pemilik")).toBe(true);
});

test("Admin cannot delete ODP", () => {
  expect(canDeleteOdp("admin")).toBe(false);
});

test("Pemilik can delete Pelanggan", () => {
  expect(canDeletePelanggan("pemilik")).toBe(true);
});

test("Admin cannot delete Pelanggan", () => {
  expect(canDeletePelanggan("admin")).toBe(false);
});

test("Pemilik can view all Tiket", () => {
  expect(canViewAllTiket("pemilik")).toBe(true);
});

test("Admin can view all Tiket", () => {
  expect(canViewAllTiket("admin")).toBe(true);
});

test("Teknisi cannot view all Tiket (only their assigned ones)", () => {
  expect(canViewAllTiket("teknisi")).toBe(false);
});

test("Pemilik can view Laporan Performa", () => {
  expect(canViewLaporanPerforma("pemilik")).toBe(true);
});

test("Admin cannot view Laporan Performa", () => {
  expect(canViewLaporanPerforma("admin")).toBe(false);
});

test("Teknisi cannot view Laporan Performa", () => {
  expect(canViewLaporanPerforma("teknisi")).toBe(false);
});
