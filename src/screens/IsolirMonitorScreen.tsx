import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { listPelangganIsolir, type PelangganIsolir } from "../pelanggan/listPelangganIsolir";
import { setPelangganIsolir } from "../pelanggan/setPelangganIsolir";
import { buildWhatsappUrl } from "../pelanggan/waPhone";
import { formatRelativeTanggal } from "../tiket/formatRelativeTanggal";
import { ScreenHeader } from "../components/ScreenHeader";
import type { UserProfile } from "../auth/profile";
import { canManageIsolir } from "../auth/permissions";

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

export function IsolirMonitorScreen({ profile, onBack }: Props) {
  const [items, setItems] = useState<PelangganIsolir[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [openingWaById, setOpeningWaById] = useState<string | null>(null);
  const [cabutIsolirById, setCabutIsolirById] = useState<string | null>(null);
  const [cabutIsolirError, setCabutIsolirError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const result = await listPelangganIsolir(supabase);
    setItems(result);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    reload().then(() => setIsLoading(false));
  }, [reload]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.nama.toLowerCase().includes(query) || item.alamat.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  async function handleOpenWhatsapp(item: PelangganIsolir) {
    if (!item.noHp) return;
    setOpeningWaById(item.id);
    try {
      const url = buildWhatsappUrl(item.noHp);
      // Sengaja TIDAK cek Linking.canOpenURL() dulu -- lihat catatan yang
      // sama di PenagihanDcScreen.tsx.
      await Linking.openURL(url);
    } catch {
      setError("Tidak bisa membuka WhatsApp untuk nomor ini.");
    } finally {
      setOpeningWaById(null);
    }
  }

  async function handleCabutIsolir(item: PelangganIsolir) {
    setCabutIsolirError(null);
    setCabutIsolirById(item.id);
    const result = await setPelangganIsolir(supabase, item.id, false);
    setCabutIsolirById(null);

    if (!result.success) {
      setCabutIsolirError(`${item.nama}: ${result.error}`);
      return;
    }

    // Begitu dicabut, Pelanggan ini bukan lagi "sedang diisolir" -- hilang
    // dari daftar ini begitu di-reload, bukan di-update di tempat.
    await reload();
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Monitor Isolir"
        subtitle={`${items.length} Pelanggan sedang diisolir`}
        onBack={onBack}
      />
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama atau alamat"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {cabutIsolirError ? <Text style={styles.error}>{cabutIsolirError}</Text> : null}

        {isLoading ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "Tidak ada Pelanggan yang cocok."
                  : "Tidak ada Pelanggan yang sedang diisolir. 🎉"}
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.cardRow}>
                <View style={styles.card}>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName}>{item.nama}</Text>
                    <Text style={styles.cardAlamat}>{item.alamat}</Text>
                    <Text style={styles.cardMeta}>
                      {[item.wilayahNama, item.odpLabel].filter(Boolean).join(" · ") || "-"}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleOpenWhatsapp(item)}
                      disabled={openingWaById === item.id}
                    >
                      <Text style={styles.cardNoHp}>{item.noHp}</Text>
                    </TouchableOpacity>
                    {item.isolirAt ? (
                      <Text style={styles.isolirBadge}>
                        🔴 Isolir sejak {formatRelativeTanggal(item.isolirAt)}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.waButton,
                      openingWaById === item.id && styles.waButtonDisabled,
                    ]}
                    onPress={() => handleOpenWhatsapp(item)}
                    disabled={openingWaById === item.id || !item.noHp}
                  >
                    <Text style={styles.waButtonText}>
                      {openingWaById === item.id ? "..." : "WhatsApp"}
                    </Text>
                  </TouchableOpacity>
                  {canManageIsolir(profile.role) ? (
                    <TouchableOpacity
                      style={[
                        styles.cabutIsolirButton,
                        cabutIsolirById === item.id && styles.waButtonDisabled,
                      ]}
                      onPress={() => handleCabutIsolir(item)}
                      disabled={cabutIsolirById === item.id}
                    >
                      <Text style={styles.cabutIsolirButtonText}>
                        {cabutIsolirById === item.id ? "..." : "Cabut Isolir"}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    padding: 16,
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
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  error: {
    color: "#DC2626",
    marginBottom: 12,
  },
  loading: {
    marginTop: 24,
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 24,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 14,
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  cardAlamat: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  cardNoHp: {
    fontSize: 12,
    color: "#1d4ed8",
    marginTop: 2,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  isolirBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
    marginTop: 6,
  },
  actionButtons: {
    gap: 8,
  },
  waButton: {
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  waButtonDisabled: {
    opacity: 0.7,
  },
  waButtonText: {
    color: "#166534",
    fontWeight: "700",
    fontSize: 11,
  },
  cabutIsolirButton: {
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  cabutIsolirButtonText: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
});
