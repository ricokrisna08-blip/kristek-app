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
  return role === "admin";
}

export function canDeletePelanggan(role: Role): boolean {
  return role === "pemilik";
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
