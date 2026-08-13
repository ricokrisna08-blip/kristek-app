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
  canEditPelanggan,
  canEditPelangganHarga,
  canMarkSudahBayarBulanIni,
  canManageIsolir,
  canViewAllTiket,
  canViewLaporanPerforma,
  canViewLaporanKeuangan,
  canSubmitCuti,
  canViewPengajuanCuti,
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

test("Admin can mark Sudah Bayar Bulan Ini", () => {
  expect(canMarkSudahBayarBulanIni("admin")).toBe(true);
});

test("Pemilik can mark Sudah Bayar Bulan Ini", () => {
  expect(canMarkSudahBayarBulanIni("pemilik")).toBe(true);
});

test("Teknisi cannot mark Sudah Bayar Bulan Ini", () => {
  expect(canMarkSudahBayarBulanIni("teknisi")).toBe(false);
});

test("Pemilik can manage isolir", () => {
  expect(canManageIsolir("pemilik")).toBe(true);
});

test("Admin cannot manage isolir", () => {
  expect(canManageIsolir("admin")).toBe(false);
});

test("Teknisi cannot manage isolir", () => {
  expect(canManageIsolir("teknisi")).toBe(false);
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

test("Pemilik can edit Pelanggan", () => {
  expect(canEditPelanggan("pemilik")).toBe(true);
});

test("Admin cannot edit Pelanggan", () => {
  expect(canEditPelanggan("admin")).toBe(false);
});

test("Teknisi cannot edit Pelanggan", () => {
  expect(canEditPelanggan("teknisi")).toBe(false);
});

test("Admin can edit Pelanggan harga", () => {
  expect(canEditPelangganHarga("admin")).toBe(true);
});

test("Pemilik cannot edit Pelanggan harga", () => {
  expect(canEditPelangganHarga("pemilik")).toBe(false);
});

test("Teknisi cannot edit Pelanggan harga", () => {
  expect(canEditPelangganHarga("teknisi")).toBe(false);
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

test("Pemilik can view Laporan Keuangan", () => {
  expect(canViewLaporanKeuangan("pemilik")).toBe(true);
});

test("Admin cannot view Laporan Keuangan", () => {
  expect(canViewLaporanKeuangan("admin")).toBe(false);
});

test("Teknisi cannot view Laporan Keuangan", () => {
  expect(canViewLaporanKeuangan("teknisi")).toBe(false);
});

test("Teknisi can submit pengajuan cuti", () => {
  expect(canSubmitCuti("teknisi")).toBe(true);
});

test("Admin and Pemilik cannot submit pengajuan cuti", () => {
  expect(canSubmitCuti("admin")).toBe(false);
  expect(canSubmitCuti("pemilik")).toBe(false);
});

test("Admin and Pemilik can view all pengajuan cuti", () => {
  expect(canViewPengajuanCuti("admin")).toBe(true);
  expect(canViewPengajuanCuti("pemilik")).toBe(true);
});

test("Teknisi cannot view all pengajuan cuti (only their own via submission screen)", () => {
  expect(canViewPengajuanCuti("teknisi")).toBe(false);
});
