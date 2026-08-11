import { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "./src/lib/supabase";
import { offlineQueueStore } from "./src/offline/offlineQueueStore.instance";
import { fetchPhotoBlob } from "./src/offline/fetchPhotoBlob";
import { fetchUserProfile, type UserProfile } from "./src/auth/profile";
import { LoginScreen } from "./src/screens/LoginScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { AccountManagementScreen } from "./src/screens/AccountManagementScreen";
import { WilayahManagementScreen } from "./src/screens/WilayahManagementScreen";
import { OdpManagementScreen } from "./src/screens/OdpManagementScreen";
import { PelangganManagementScreen } from "./src/screens/PelangganManagementScreen";
import { PaketManagementScreen } from "./src/screens/PaketManagementScreen";
import { CreateTiketScreen } from "./src/screens/CreateTiketScreen";
import { MyTiketScreen } from "./src/screens/MyTiketScreen";
import { InstallationEvidenceScreen } from "./src/screens/InstallationEvidenceScreen";
import { LaporanPerformaScreen } from "./src/screens/LaporanPerformaScreen";

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
  | "myTiketInstalasi"
  | "myTiketMaintenance"
  | "myTiketGangguan"
  | "installationEvidence";

export default function App() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [screen, setScreen] = useState<Screen>("home");

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
          title="Gangguan-Komplain"
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
        onNavigateToInstalasi={() => setScreen("myTiketInstalasi")}
        onNavigateToInstallationEvidence={() => setScreen("installationEvidence")}
        onNavigateToMaintenance={() => setScreen("myTiketMaintenance")}
        onNavigateToGangguan={() => setScreen("myTiketGangguan")}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        {profile ? (
          renderSignedIn(profile)
        ) : (
          <LoginScreen onSignedIn={handleSignedIn} />
        )}
      </SafeAreaView>
      <StatusBar style="auto" />
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
