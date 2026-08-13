import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
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
      <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
        <View style={styles.heroRow}>
          <Image
            source={require("../../assets/Logo_kristek_apps.png")}
            style={styles.logo}
            resizeMode="cover"
          />
          <View style={styles.bellWrap}>
            <NotifikasiBell userId={profile.id} />
          </View>
        </View>
      </View>

      <Text style={styles.title}>{GREETING_BY_ROLE[profile.role]}</Text>
      <Text style={styles.subtitle}>
        Halo, <Text style={styles.subtitleName}>{profile.nama}</Text>
      </Text>

      <View style={styles.grid}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.key} style={styles.gridItem} onPress={item.onPress}>
            <View style={styles.gridIconBadge}>
              <Text style={styles.gridIcon}>{item.icon}</Text>
            </View>
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

const KRISTEK_TEAL = "#1B7396";
const KRISTEK_NAVY = "#0B2D5B";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 32,
    backgroundColor: "#F8FAFC",
  },
  hero: {
    backgroundColor: KRISTEK_NAVY,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 20,
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 54,
    height: 45,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bellWrap: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: KRISTEK_NAVY,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  subtitleName: {
    color: KRISTEK_TEAL,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 24,
  },
  gridItem: {
    width: "30%",
    minHeight: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  gridIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E7F1F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  gridIcon: {
    fontSize: 22,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: KRISTEK_NAVY,
    textAlign: "center",
  },
  logoutButton: {
    marginTop: 28,
    alignSelf: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  logoutButtonText: {
    color: "#DC2626",
    fontWeight: "700",
  },
});
