import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
} from "../auth/permissions";
import { NotifikasiBell } from "../components/NotifikasiBell";

const GREETING_BY_ROLE: Record<UserProfile["role"], string> = {
  pemilik: "Beranda Pemilik",
  admin: "Beranda Admin",
  teknisi: "Beranda Teknisi",
};

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
  onNavigateToInstalasi: () => void;
  onNavigateToInstallationEvidence: () => void;
  onNavigateToMaintenance: () => void;
  onNavigateToGangguan: () => void;
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
  onNavigateToInstalasi,
  onNavigateToInstallationEvidence,
  onNavigateToMaintenance,
  onNavigateToGangguan,
  onLogout,
}: Props) {
  const menuItems: MenuItem[] = [];

  if (canManageAccounts(profile.role)) {
    menuItems.push({ key: "accounts", icon: "👤", label: "Kelola Akun", onPress: onNavigateToAccounts });
  }
  if (canManageWilayah(profile.role)) {
    menuItems.push({ key: "wilayah", icon: "🗺️", label: "Kelola Wilayah", onPress: onNavigateToWilayah });
  }
  if (canViewOdp(profile.role)) {
    menuItems.push({ key: "odp", icon: "📡", label: "Kelola ODP", onPress: onNavigateToOdp });
  }
  if (canViewPelanggan(profile.role)) {
    menuItems.push({ key: "pelanggan", icon: "👥", label: "Kelola Pelanggan", onPress: onNavigateToPelanggan });
  }
  if (canManagePaket(profile.role)) {
    menuItems.push({ key: "paket", icon: "📶", label: "Kelola Paket", onPress: onNavigateToPaket });
  }
  if (canCreateTiket(profile.role)) {
    menuItems.push({ key: "createTiket", icon: "🎫", label: "Buat Tiket", onPress: onNavigateToCreateTiket });
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
  if (profile.role === "teknisi") {
    menuItems.push(
      { key: "instalasi", icon: "🛠️", label: "Instalasi", onPress: onNavigateToInstalasi },
      {
        key: "installationEvidence",
        icon: "📸",
        label: "Installation Evidence",
        onPress: onNavigateToInstallationEvidence,
      },
      { key: "maintenance", icon: "🔧", label: "Maintenance", onPress: onNavigateToMaintenance },
      { key: "gangguan", icon: "⚠️", label: "Gangguan-Komplain", onPress: onNavigateToGangguan }
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Image
          source={require("../../assets/Logo-kristek-transparent.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <NotifikasiBell userId={profile.id} />
      </View>

      <Text style={styles.title}>{GREETING_BY_ROLE[profile.role]}</Text>
      <Text style={styles.subtitle}>Halo, {profile.nama}</Text>

      <View style={styles.grid}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.key} style={styles.gridItem} onPress={item.onPress}>
            <Text style={styles.gridIcon}>{item.icon}</Text>
            <Text style={styles.gridLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 44,
    height: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginTop: 20,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
    marginTop: 16,
  },
  gridItem: {
    width: "30%",
    minHeight: 90,
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  gridIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e3a8a",
    textAlign: "center",
  },
  logoutButton: {
    marginTop: 28,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  logoutButtonText: {
    color: "#c0392b",
    fontWeight: "600",
  },
});
