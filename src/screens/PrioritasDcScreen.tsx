import { useCallback, useEffect, useMemo, useState } from "react";
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
  listBelumBayarUntukDc,
  type PelangganBelumBayarDc,
} from "../pelanggan/listBelumBayarUntukDc";
import { setPrioritasDc } from "../pelanggan/setPrioritasDc";
import type { UserProfile } from "../auth/profile";
import { ScreenHeader } from "../components/ScreenHeader";

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

function formatHarga(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

export function PrioritasDcScreen({ profile, onBack }: Props) {
  const [items, setItems] = useState<PelangganBelumBayarDc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const reload = useCallback(async () => {
    const result = await listBelumBayarUntukDc(supabase, profile.id);
    setItems(result);
  }, [profile.id]);

  useEffect(() => {
    setIsLoading(true);
    reload().then(() => setIsLoading(false));
  }, [reload]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => item.nama.toLowerCase().includes(query));
  }, [items, searchQuery]);

  const jumlahPrioritas = useMemo(
    () => items.filter((item) => item.prioritasDc).length,
    [items]
  );

  async function handleToggle(item: PelangganBelumBayarDc) {
    setSavingId(item.id);
    setError(null);
    const result = await setPrioritasDc(supabase, item.id, !item.prioritasDc);
    setSavingId(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    await reload();
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Prioritas DC"
        subtitle={`${jumlahPrioritas} dari ${items.length} Pelanggan ditandai prioritas`}
        onBack={onBack}
      />
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama Pelanggan"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Text style={styles.hint}>
          Tandai Pelanggan yang harus DIDAHULUKAN DC waktu keliling menagih.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

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
                  : "Semua Pelanggan sudah bayar bulan ini."}
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, item.prioritasDc && styles.cardPrioritas]}
                onPress={() => handleToggle(item)}
                disabled={savingId === item.id}
              >
                <View style={styles.cardBody}>
                  {item.prioritasDc ? (
                    <Text style={styles.prioritasBadge}>🔥 Prioritas</Text>
                  ) : null}
                  <Text style={styles.cardName}>{item.nama}</Text>
                  <Text style={styles.cardAlamat}>{item.alamat}</Text>
                  <Text style={styles.cardHarga}>{formatHarga(item.tagihan)}</Text>
                </View>
                <View style={[styles.checkbox, item.prioritasDc && styles.checkboxChecked]}>
                  {savingId === item.id ? (
                    <ActivityIndicator size="small" color={item.prioritasDc ? "#fff" : "#B45309"} />
                  ) : item.prioritasDc ? (
                    <Text style={styles.checkboxMark}>✓</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
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
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 14,
    marginBottom: 10,
  },
  cardPrioritas: {
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  cardBody: {
    flex: 1,
  },
  prioritasBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    marginBottom: 4,
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
  cardHarga: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B7396",
    marginTop: 6,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: "#B45309",
    borderColor: "#B45309",
  },
  checkboxMark: {
    color: "#fff",
    fontWeight: "700",
  },
});
