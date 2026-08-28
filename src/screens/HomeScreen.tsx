import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { getRingkasanTeknisi, type RingkasanTeknisi } from "../tiket/getRingkasanTeknisi";
import type { UserProfile } from "../auth/profile";
import {
  canManageAccounts,
  canManageWilayah,
  canViewOdp,
  canViewPelanggan,
  canManagePaket,
  canCreateTiket,
  canViewAllTiket,
  canViewLaporanPerforma,
  canViewLaporanKeuangan,
  canSubmitCuti,
  canViewPengajuanCuti,
  canTriggerWaBlast,
  canResetTiketData,
  canViewPenagihanDc,
  canApproveSetoranDc,
} from "../auth/permissions";
import { NotifikasiBell } from "../components/NotifikasiBell";

const GREETING_BY_ROLE: Record<UserProfile["role"], string> = {
  pemilik: "Beranda Pemilik",
  admin: "Beranda Admin",
  teknisi: "Beranda Teknisi",
  dc: "Beranda DC",
  system: "Beranda System",
};

const ROLE_LABEL: Record<UserProfile["role"], string> = {
  pemilik: "Pemilik Usaha",
  admin: "Administrator",
  teknisi: "Teknisi Lapangan",
  dc: "Debt Collector",
  system: "System (WA Blast)",
};

const FOOTNOTE_BY_ROLE: Record<UserProfile["role"], string> = {
  pemilik: "KRISTEK — Aplikasi Manajemen ISP",
  admin: "KRISTEK — Aplikasi Manajemen ISP",
  teknisi: "KRISTEK — Aplikasi Teknisi Lapangan",
  dc: "KRISTEK — Aplikasi Penagihan",
  system: "KRISTEK — Akun System WA Blast",
};

function getInitials(nama: string): string {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

type Props = {
  profile: UserProfile;
  onNavigateToAccounts: () => void;
  onNavigateToWilayah: () => void;
  onNavigateToOdp: () => void;
  onNavigateToPelanggan: () => void;
  onNavigateToPaket: () => void;
  onNavigateToCreateTiket: () => void;
  onNavigateToDaftarTiket: () => void;
  onNavigateToLaporanPerforma: () => void;
  onNavigateToLaporanKeuangan: () => void;
  onNavigateToPengajuanCuti: () => void;
  onNavigateToDaftarPengajuanCuti: () => void;
  onNavigateToWaBlast: () => void;
  onNavigateToInstalasi: () => void;
  onNavigateToInstallationEvidence: () => void;
  onNavigateToMaintenance: () => void;
  onNavigateToGangguan: () => void;
  onNavigateToTiketDetail: (tiketId: string) => void;
  onNavigateToDataReset: () => void;
  onNavigateToPenagihanDc: () => void;
  onNavigateToApprovalSetoranDc: () => void;
  onLogout: () => void;
};

type MenuItem = {
  key: string;
  icon: string;
  label: string;
  onPress: () => void;
};

export function HomeScreen({
  profile,
  onNavigateToAccounts,
  onNavigateToWilayah,
  onNavigateToOdp,
  onNavigateToPelanggan,
  onNavigateToPaket,
  onNavigateToCreateTiket,
  onNavigateToDaftarTiket,
  onNavigateToLaporanPerforma,
  onNavigateToLaporanKeuangan,
  onNavigateToPengajuanCuti,
  onNavigateToDaftarPengajuanCuti,
  onNavigateToWaBlast,
  onNavigateToInstalasi,
  onNavigateToInstallationEvidence,
  onNavigateToMaintenance,
  onNavigateToGangguan,
  onNavigateToTiketDetail,
  onNavigateToDataReset,
  onNavigateToPenagihanDc,
  onNavigateToApprovalSetoranDc,
  onLogout,
}: Props) {
  const insets = useSafeAreaInsets();
  const [ringkasan, setRingkasan] = useState<RingkasanTeknisi | null>(null);

  useEffect(() => {
    if (profile.role === "teknisi") {
      getRingkasanTeknisi(supabase).then(setRingkasan);
    }
  }, [profile.role]);

  const menuItems: MenuItem[] = [];

  if (canManageAccounts(profile.role)) {
    menuItems.push({ key: "accounts", icon: "👤", label: "Kelola Akun", onPress: onNavigateToAccounts });
  }
  if (canManageWilayah(profile.role)) {
    menuItems.push({ key: "wilayah", icon: "🗺️", label: "Kelola Wilayah", onPress: onNavigateToWilayah });
  }
  if (canViewOdp(profile.role)) {
    menuItems.push({ key: "odp", icon: "🗄️", label: "Kelola ODP", onPress: onNavigateToOdp });
  }
  if (canViewPelanggan(profile.role)) {
    menuItems.push({ key: "pelanggan", icon: "👥", label: "Kelola Pelanggan", onPress: onNavigateToPelanggan });
  }
  if (canManagePaket(profile.role)) {
    menuItems.push({ key: "paket", icon: "📶", label: "Kelola Paket", onPress: onNavigateToPaket });
  }
  if (canCreateTiket(profile.role)) {
    menuItems.push({ key: "createTiket", icon: "📝", label: "Buat Tiket", onPress: onNavigateToCreateTiket });
  }
  if (canViewAllTiket(profile.role)) {
    menuItems.push({ key: "daftarTiket", icon: "📋", label: "Daftar Tiket", onPress: onNavigateToDaftarTiket });
  }
  if (canViewLaporanPerforma(profile.role)) {
    menuItems.push({
      key: "laporanPerforma",
      icon: "📊",
      label: "Laporan Performa",
      onPress: onNavigateToLaporanPerforma,
    });
  }
  if (canViewLaporanKeuangan(profile.role)) {
    menuItems.push({
      key: "laporanKeuangan",
      icon: "💰",
      label: "Laporan Keuangan",
      onPress: onNavigateToLaporanKeuangan,
    });
  }
  if (canViewPengajuanCuti(profile.role)) {
    menuItems.push({
      key: "daftarPengajuanCuti",
      icon: "📅",
      label: "Pengajuan Cuti",
      onPress: onNavigateToDaftarPengajuanCuti,
    });
  }
  if (canTriggerWaBlast(profile.role)) {
    menuItems.push({
      key: "waBlast",
      icon: "📲",
      label: "Blast Tagihan WA",
      onPress: onNavigateToWaBlast,
    });
  }
  if (profile.role === "teknisi") {
    menuItems.push(
      { key: "instalasi", icon: "🔧", label: "Instalasi", onPress: onNavigateToInstalasi },
      {
        key: "installationEvidence",
        icon: "📸",
        label: "Installation Evidence",
        onPress: onNavigateToInstallationEvidence,
      },
      { key: "maintenance", icon: "⚙️", label: "Maintenance", onPress: onNavigateToMaintenance },
      { key: "gangguan", icon: "⚠️", label: "Laporan Pelanggan", onPress: onNavigateToGangguan }
    );
  }
  if (canSubmitCuti(profile.role)) {
    menuItems.push({
      key: "pengajuanCuti",
      icon: "🌴",
      label: "Ajukan Cuti/Izin",
      onPress: onNavigateToPengajuanCuti,
    });
  }
  if (canResetTiketData(profile.role)) {
    menuItems.push({
      key: "dataReset",
      icon: "🗑️",
      label: "Reset Data",
      onPress: onNavigateToDataReset,
    });
  }
  if (canViewPenagihanDc(profile.role)) {
    menuItems.push({
      key: "penagihanDc",
      icon: "🧾",
      label: "Penagihan",
      onPress: onNavigateToPenagihanDc,
    });
  }
  if (canApproveSetoranDc(profile.role)) {
    menuItems.push({
      key: "approvalSetoranDc",
      icon: "✅",
      label: "Approval Setoran DC",
      onPress: onNavigateToApprovalSetoranDc,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <View style={styles.heroRow}>
          <Image
            source={require("../../assets/Logo_kristek_apps.png")}
            style={styles.logo}
            resizeMode="cover"
          />
          <View style={styles.bellWrap}>
            <NotifikasiBell
              userId={profile.id}
              onNavigateToTiket={onNavigateToTiketDetail}
              onNavigateToCuti={onNavigateToDaftarPengajuanCuti}
              onNavigateToApprovalSetoranDc={onNavigateToApprovalSetoranDc}
            />
          </View>
        </View>
      </View>

      <View style={styles.greetCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(profile.nama)}</Text>
        </View>
        <View style={styles.greetText}>
          <Text style={styles.eyebrow}>{GREETING_BY_ROLE[profile.role]}</Text>
          <Text style={styles.name}>{profile.nama}</Text>
          <View style={styles.roleChip}>
            <Text style={styles.roleChipText}>{ROLE_LABEL[profile.role]}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {profile.role === "teknisi" ? (
          <>
            <Text style={styles.sectionTitle}>Ringkasan hari ini</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{ringkasan?.baru ?? "-"}</Text>
                <Text style={styles.summaryLabel}>Baru</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{ringkasan?.progress ?? "-"}</Text>
                <Text style={styles.summaryLabel}>Progress</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{ringkasan?.selesaiBulanIni ?? "-"}</Text>
                <Text style={styles.summaryLabel}>Selesai</Text>
              </View>
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Menu utama</Text>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.key} style={styles.gridItem} onPress={item.onPress}>
              <View style={styles.gridIconBadge}>
                <Text style={styles.gridIconEmoji}>{item.icon}</Text>
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Feather name="log-out" size={16} color="#DC2626" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>{FOOTNOTE_BY_ROLE[profile.role]}</Text>
      </View>
    </ScrollView>
  );
}

const KRISTEK_TEAL = "#1B7396";
const KRISTEK_NAVY = "#0B2D5B";
const KRISTEK_NAVY_2 = "#123A70";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 32,
    backgroundColor: "#F8FAFC",
  },
  hero: {
    backgroundColor: KRISTEK_NAVY,
    paddingBottom: 44,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 13,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bellWrap: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
  },
  greetCard: {
    marginTop: -30,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    shadowColor: KRISTEK_NAVY,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: KRISTEK_TEAL,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  greetText: {
    flex: 1,
    flexShrink: 1,
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#7A8699",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  name: {
    fontWeight: "700",
    fontSize: 17,
    color: KRISTEK_NAVY,
    marginBottom: 6,
  },
  roleChip: {
    alignSelf: "flex-start",
    backgroundColor: "#E7F1F5",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: KRISTEK_TEAL,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: KRISTEK_NAVY,
    marginBottom: 12,
    marginTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  gridItem: {
    width: "47.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEEF2",
    alignItems: "flex-start",
    paddingVertical: 18,
    paddingHorizontal: 14,
    shadowColor: KRISTEK_NAVY,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  gridIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#E7F0F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  gridIconEmoji: {
    fontSize: 24,
  },
  gridLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: KRISTEK_NAVY,
    lineHeight: 17,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEEF2",
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#EBEEF2",
  },
  summaryValue: {
    fontWeight: "700",
    fontSize: 20,
    color: KRISTEK_NAVY,
  },
  summaryLabel: {
    fontSize: 10.5,
    color: "#7A8699",
    marginTop: 3,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 13.5,
  },
  footnote: {
    textAlign: "center",
    fontSize: 11,
    color: "#7A8699",
    marginTop: 16,
  },
});
