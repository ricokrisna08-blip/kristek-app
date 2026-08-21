import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import {
  searchPelanggan,
  type PelangganListItem,
} from "../pelanggan/searchPelanggan";
import { findInstalasiTiketForPelanggan } from "../tiket/findInstalasiTiketForPelanggan";
import { getTiketDetail, type TiketDetail } from "../tiket/getTiketDetail";
import { TiketDetailView } from "../components/TiketDetailView";
import { ScreenHeader } from "../components/ScreenHeader";
import type { UserProfile } from "../auth/profile";

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

export function InstallationEvidenceScreen({ profile, onBack }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PelangganListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);
  const [detail, setDetail] = useState<TiketDetail | null>(null);

  useEffect(() => {
    searchPelanggan(supabase, query).then(setResults);
  }, [query]);

  async function handleSelectPelanggan(item: PelangganListItem) {
    setNotFoundError(null);
    setIsSearching(true);
    const tiketId = await findInstalasiTiketForPelanggan(supabase, item.id);

    if (!tiketId) {
      setIsSearching(false);
      setNotFoundError(
        `Tidak ada Tiket Instalasi untuk ${item.nama} yang ditugaskan ke Anda.`
      );
      return;
    }

    const tiketDetail = await getTiketDetail(supabase, tiketId);
    setIsSearching(false);
    setDetail(tiketDetail);
  }

  async function handleChanged() {
    if (!detail) return;
    const refreshed = await getTiketDetail(supabase, detail.id);
    setDetail(refreshed);
  }

  if (detail) {
    return (
      <TiketDetailView
        detail={detail}
        profile={profile}
        onBack={() => setDetail(null)}
        onChanged={handleChanged}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Installation Evidence"
        subtitle="Cari Pelanggan, lalu upload foto bukti Instalasi lewat Tiket yang ditugaskan ke Anda."
        onBack={onBack}
      />
      <View style={styles.container}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama atau Nomor Pelanggan"
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {isSearching ? <ActivityIndicator style={styles.loading} /> : null}
      {notFoundError ? <Text style={styles.error}>{notFoundError}</Text> : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Belum ada Pelanggan yang cocok.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelectPelanggan(item)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.nama.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.listItemLabel}>{item.nama}</Text>
              <Text style={styles.listItemDetail}>{item.nomorPelanggan}</Text>
            </View>
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraBadgeText}>📸</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      </View>
    </View>
  );
}

const KRISTEK_TEAL = "#1B7396";
const KRISTEK_NAVY = "#0B2D5B";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    padding: 24,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 24,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
  },
  loading: {
    marginBottom: 8,
  },
  emptyText: {
    color: "#6b7280",
    paddingVertical: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 12,
    marginBottom: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: KRISTEK_TEAL,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  cardBody: {
    flex: 1,
    flexShrink: 1,
  },
  listItemLabel: {
    fontWeight: "600",
    fontSize: 15,
    color: "#111827",
  },
  listItemDetail: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  cameraBadge: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E7F1F5",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadgeText: {
    fontSize: 15,
  },
  error: {
    color: "#DC2626",
    marginBottom: 10,
  },
});
