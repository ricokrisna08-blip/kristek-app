import type { Role } from "../domain/types";

export function canManageAccounts(role: Role): boolean {
  return role === "pemilik";
}

export function canManageWilayah(role: Role): boolean {
  return role === "pemilik";
}

export function canViewOdp(role: Role): boolean {
  return role === "pemilik" || role === "admin";
}

export function canCreateOdp(role: Role): boolean {
  return role === "admin" || role === "pemilik";
}

export function canDeleteOdp(role: Role): boolean {
  return role === "pemilik";
}

export function canViewPelanggan(role: Role): boolean {
  return role === "pemilik" || role === "admin";
}

export function canCreatePelanggan(role: Role): boolean {
  return role === "admin" || role === "pemilik";
}

export function canDeletePelanggan(role: Role): boolean {
  return role === "pemilik";
}

export function canEditPelanggan(role: Role): boolean {
  return role === "pemilik";
}

export function canEditPelangganHarga(role: Role): boolean {
  return role === "admin";
}

export function canMarkSudahBayarBulanIni(role: Role): boolean {
  return role === "admin" || role === "pemilik";
}

export function canManageIsolir(role: Role): boolean {
  return role === "pemilik";
}

export function canManageMikrotikUsername(role: Role): boolean {
  return role === "admin" || role === "pemilik";
}

export function canManagePaket(role: Role): boolean {
  return role === "pemilik";
}

export function canCreateTiket(role: Role): boolean {
  return role === "admin";
}

export function canViewAllTiket(role: Role): boolean {
  return role === "pemilik" || role === "admin";
}

export function canViewLaporanPerforma(role: Role): boolean {
  return role === "pemilik";
}

export function canViewLaporanKeuangan(role: Role): boolean {
  return role === "pemilik";
}

export function canSubmitCuti(role: Role): boolean {
  return role === "teknisi";
}

export function canViewPengajuanCuti(role: Role): boolean {
  return role === "admin" || role === "pemilik";
}

export function canDeletePengajuanCuti(role: Role): boolean {
  return role === "admin" || role === "pemilik";
}

export function canTriggerWaBlast(role: Role): boolean {
  return role === "pemilik";
}
