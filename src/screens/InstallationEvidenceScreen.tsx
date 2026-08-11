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
import { BackButton } from "../components/BackButton";
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
    <View style={styles.container}>
      <BackButton onPress={onBack} />

      <Text style={styles.title}>Installation Evidence</Text>
      <Text style={styles.subtitleText}>
        Cari Pelanggan, lalu upload foto bukti Instalasi lewat Tiket yang
        ditugaskan ke Anda.
      </Text>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 4,
  },
  subtitleText: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 16,
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
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2563eb",
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
  },
  cameraBadgeText: {
    fontSize: 18,
  },
  error: {
    color: "#c0392b",
    marginBottom: 10,
  },
});
