import { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "./src/lib/supabase";
import { offlineQueueStore } from "./src/offline/offlineQueueStore.instance";
import { fetchPhotoBlob } from "./src/offline/fetchPhotoBlob";
import { fetchUserProfile, type UserProfile } from "./src/auth/profile";
import { registerExpoPush } from "./src/notifikasi/registerExpoPush";
import { registerWebPush } from "./src/notifikasi/registerWebPush";
import { LoginScreen } from "./src/screens/LoginScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { AccountManagementScreen } from "./src/screens/AccountManagementScreen";
import { WilayahManagementScreen } from "./src/screens/WilayahManagementScreen";
import { OdpManagementScreen } from "./src/screens/OdpManagementScreen";
import { PelangganManagementScreen } from "./src/screens/PelangganManagementScreen";
import { PaketManagementScreen } from "./src/screens/PaketManagementScreen";
import { CreateTiketScreen } from "./src/screens/CreateTiketScreen";
import { MyTiketScreen } from "./src/screens/MyTiketScreen";
import { TiketDetailScreen } from "./src/screens/TiketDetailScreen";
import { InstallationEvidenceScreen } from "./src/screens/InstallationEvidenceScreen";
import { LaporanPerformaScreen } from "./src/screens/LaporanPerformaScreen";
import { LaporanKeuanganScreen } from "./src/screens/LaporanKeuanganScreen";
import { PengajuanCutiScreen } from "./src/screens/PengajuanCutiScreen";
import { DaftarPengajuanCutiScreen } from "./src/screens/DaftarPengajuanCutiScreen";
import { WaBlastScreen } from "./src/screens/WaBlastScreen";
import { DataResetScreen } from "./src/screens/DataResetScreen";
import { PenagihanDcScreen } from "./src/screens/PenagihanDcScreen";
import { ApprovalSetoranDcScreen } from "./src/screens/ApprovalSetoranDcScreen";

type Screen =
  | "home"
  | "accounts"
  | "wilayah"
  | "odp"
  | "pelanggan"
  | "paket"
  | "createTiket"
  | "daftarTiket"
  | "laporanPerforma"
  | "laporanKeuangan"
  | "pengajuanCuti"
  | "daftarPengajuanCuti"
  | "waBlast"
  | "myTiketInstalasi"
  | "myTiketMaintenance"
  | "myTiketGangguan"
  | "installationEvidence"
  | "tiketDetail"
  | "dataReset"
  | "penagihanDc"
  | "approvalSetoranDc";

// Web tidak support expo-notifications sama sekali, jadi handler ini cuma
// perlu di-set di native supaya alert push tetap muncul walau app lagi
// dibuka (foreground) -- tanpa ini Android/iOS diam-diam nge-skip alert.
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export default function App() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedTiketId, setSelectedTiketId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfileForCurrentSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (isMounted) setIsCheckingSession(false);
        return;
      }

      const loadedProfile = await fetchUserProfile(supabase, session.user.id);
      if (isMounted) {
        setProfile(loadedProfile);
        setIsCheckingSession(false);
      }
    }

    loadProfileForCurrentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (Platform.OS === "web") {
      registerWebPush(supabase, profile.id);
    } else {
      registerExpoPush(supabase, profile.id);
    }
  }, [profile]);

  useEffect(() => {
    offlineQueueStore.hydrate().then(() => {
      offlineQueueStore.syncNow(supabase, fetchPhotoBlob);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        offlineQueueStore.syncNow(supabase, fetchPhotoBlob);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (screen !== "home") {
          setScreen("home");
          return true;
        }
        return false;
      }
    );

    return () => subscription.remove();
  }, [screen]);

  async function handleSignedIn(userId: string) {
    const loadedProfile = await fetchUserProfile(supabase, userId);
    setProfile(loadedProfile);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProfile(null);
    setScreen("home");
  }

  if (isCheckingSession) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <ActivityIndicator />
          <StatusBar style="auto" />
        </View>
      </SafeAreaProvider>
    );
  }

  function renderSignedIn(currentProfile: UserProfile) {
    if (screen === "accounts") {
      return <AccountManagementScreen onBack={() => setScreen("home")} />;
    }
    if (screen === "wilayah") {
      return <WilayahManagementScreen onBack={() => setScreen("home")} />;
    }
    if (screen === "odp") {
      return (
        <OdpManagementScreen
          profile={currentProfile}
          onBack={() => setScreen("home")}
        />
      );
    }
    if (screen === "pelanggan") {
      return (
        <PelangganManagementScreen
          profile={currentProfile}
          onBack={() => setScreen("home")}
        />
      );
    }
    if (screen === "paket") {
      return <PaketManagementScreen onBack={() => setScreen("home")} />;
    }
    if (screen === "createTiket") {
      return (
        <CreateTiketScreen
          profile={currentProfile}
          onBack={() => setScreen("home")}
          onCreated={() => setScreen("home")}
        />
      );
    }
    if (screen === "daftarTiket") {
      return (
        <MyTiketScreen
          profile={currentProfile}
          title="Daftar Tiket"
          onBack={() => setScreen("home")}
        />
      );
    }
    if (screen === "laporanPerforma") {
      return <LaporanPerformaScreen onBack={() => setScreen("home")} />;
    }
    if (screen === "laporanKeuangan") {
      return <LaporanKeuanganScreen onBack={() => setScreen("home")} />;
    }
    if (screen === "pengajuanCuti") {
      return (
        <PengajuanCutiScreen profile={currentProfile} onBack={() => setScreen("home")} />
      );
    }
    if (screen === "daftarPengajuanCuti") {
      return (
        <DaftarPengajuanCutiScreen profile={currentProfile} onBack={() => setScreen("home")} />
      );
    }
    if (screen === "waBlast") {
      return <WaBlastScreen profile={currentProfile} onBack={() => setScreen("home")} />;
    }
    if (screen === "myTiketInstalasi") {
      return (
        <MyTiketScreen
          profile={currentProfile}
          title="Instalasi"
          jenisFilter="instalasi"
          onBack={() => setScreen("home")}
        />
      );
    }
    if (screen === "myTiketMaintenance") {
      return (
        <MyTiketScreen
          profile={currentProfile}
          title="Maintenance"
          jenisFilter="maintenance"
          onBack={() => setScreen("home")}
        />
      );
    }
    if (screen === "myTiketGangguan") {
      return (
        <MyTiketScreen
          profile={currentProfile}
          title="Laporan Pelanggan"
          jenisFilter="gangguan_komplain"
          onBack={() => setScreen("home")}
        />
      );
    }
    if (screen === "installationEvidence") {
      return (
        <InstallationEvidenceScreen
          profile={currentProfile}
          onBack={() => setScreen("home")}
        />
      );
    }
    if (screen === "dataReset") {
      return <DataResetScreen onBack={() => setScreen("home")} />;
    }
    if (screen === "penagihanDc") {
      return (
        <PenagihanDcScreen profile={currentProfile} onBack={() => setScreen("home")} />
      );
    }
    if (screen === "approvalSetoranDc") {
      return <ApprovalSetoranDcScreen onBack={() => setScreen("home")} />;
    }
    if (screen === "tiketDetail" && selectedTiketId) {
      return (
        <TiketDetailScreen
          tiketId={selectedTiketId}
          profile={currentProfile}
          onBack={() => setScreen("home")}
        />
      );
    }
    return (
      <HomeScreen
        profile={currentProfile}
        onNavigateToAccounts={() => setScreen("accounts")}
        onNavigateToWilayah={() => setScreen("wilayah")}
        onNavigateToOdp={() => setScreen("odp")}
        onNavigateToPelanggan={() => setScreen("pelanggan")}
        onNavigateToPaket={() => setScreen("paket")}
        onNavigateToCreateTiket={() => setScreen("createTiket")}
        onNavigateToDaftarTiket={() => setScreen("daftarTiket")}
        onNavigateToLaporanPerforma={() => setScreen("laporanPerforma")}
        onNavigateToLaporanKeuangan={() => setScreen("laporanKeuangan")}
        onNavigateToPengajuanCuti={() => setScreen("pengajuanCuti")}
        onNavigateToDaftarPengajuanCuti={() => setScreen("daftarPengajuanCuti")}
        onNavigateToWaBlast={() => setScreen("waBlast")}
        onNavigateToInstalasi={() => setScreen("myTiketInstalasi")}
        onNavigateToInstallationEvidence={() => setScreen("installationEvidence")}
        onNavigateToMaintenance={() => setScreen("myTiketMaintenance")}
        onNavigateToGangguan={() => setScreen("myTiketGangguan")}
        onNavigateToTiketDetail={(tiketId) => {
          setSelectedTiketId(tiketId);
          setScreen("tiketDetail");
        }}
        onNavigateToDataReset={() => setScreen("dataReset")}
        onNavigateToPenagihanDc={() => setScreen("penagihanDc")}
        onNavigateToApprovalSetoranDc={() => setScreen("approvalSetoranDc")}
        onLogout={handleLogout}
      />
    );
  }

  const hasDarkHeader = !profile || screen === "home";

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={styles.safeArea}
        edges={hasDarkHeader ? ["bottom", "left", "right"] : ["top", "bottom", "left", "right"]}
      >
        {profile ? (
          renderSignedIn(profile)
        ) : (
          <LoginScreen onSignedIn={handleSignedIn} />
        )}
      </SafeAreaView>
      <StatusBar style={hasDarkHeader ? "light" : "auto"} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
