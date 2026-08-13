import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { listPengajuanCuti, type PengajuanCutiItem } from "../cuti/listPengajuanCuti";
import { BackButton } from "../components/BackButton";

type Props = {
  onBack: () => void;
};

// tanggal_mulai/tanggal_selesai adalah kolom `date` murni ("YYYY-MM-DD"),
// jadi perlu ditambah "T00:00:00" supaya di-parse sebagai waktu lokal,
// bukan tengah malam UTC yang bisa geser mundur satu hari.
function formatTanggal(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// created_at sudah timestamp lengkap (dengan jam & timezone) -- JANGAN
// ditambah "T00:00:00" lagi, itu yang bikin hasilnya "Invalid Date".
function formatWaktuDiajukan(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DaftarPengajuanCutiScreen({ onBack }: Props) {
  const [items, setItems] = useState<PengajuanCutiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listPengajuanCuti(supabase).then((result) => {
      setItems(result);
      setIsLoading(false);
    });
  }, []);

  return (
    <View style={styles.container}>
      <BackButton onPress={onBack} />

      <Text style={styles.title}>Pengajuan Cuti/Izin</Text>
      <Text style={styles.count}>{items.length} pengajuan tercatat</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          style={styles.list}
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Belum ada pengajuan cuti/izin dari Teknisi.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.teknisiNama.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardNama}>{item.teknisiNama}</Text>
                <Text style={styles.cardRange}>
                  {formatTanggal(item.tanggalMulai)} — {formatTanggal(item.tanggalSelesai)}
                </Text>
                <Text style={styles.cardAlasan}>{item.alasan}</Text>
                <Text style={styles.cardDate}>Diajukan {formatWaktuDiajukan(item.createdAt)}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const KRISTEK_TEAL = "#1B7396";
const KRISTEK_NAVY = "#0B2D5B";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: KRISTEK_NAVY,
    marginTop: 16,
  },
  count: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
    marginBottom: 16,
  },
  loading: {
    marginVertical: 12,
  },
  list: {
    flex: 1,
  },
  emptyText: {
    color: "#6b7280",
    paddingVertical: 8,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 14,
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
  cardNama: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  cardRange: {
    fontSize: 13,
    color: KRISTEK_TEAL,
    fontWeight: "600",
    marginTop: 2,
  },
  cardAlasan: {
    fontSize: 13,
    color: "#374151",
    marginTop: 4,
  },
  cardDate: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 6,
  },
});
