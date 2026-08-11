import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { getTeknisiPerformance } from "../tiket/getTeknisiPerformance";
import type { TeknisiPerformance } from "../tiket/computeTeknisiPerformance";
import { formatDurasiKerja } from "../tiket/durasiKerja";
import { BackButton } from "../components/BackButton";

type Props = {
  onBack: () => void;
};

export function LaporanPerformaScreen({ onBack }: Props) {
  const [performaList, setPerformaList] = useState<TeknisiPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getTeknisiPerformance(supabase).then((result) => {
      setPerformaList(result);
      setIsLoading(false);
    });
  }, []);

  return (
    <View style={styles.container}>
      <BackButton onPress={onBack} />

      <Text style={styles.title}>Laporan Performa Teknisi</Text>
      <Text style={styles.count}>{performaList.length} Teknisi</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={performaList}
          keyExtractor={(item) => item.teknisiId}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada Teknisi.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.namaTeknisi.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.namaTeknisi}>{item.namaTeknisi}</Text>
              </View>
              <View style={styles.statGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{item.jumlahTiketSelesai}</Text>
                  <Text style={styles.statLabel}>Tiket Selesai</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {item.rataRataDurasiKerjaSeconds !== null
                      ? formatDurasiKerja(Math.round(item.rataRataDurasiKerjaSeconds))
                      : "-"}
                  </Text>
                  <Text style={styles.statLabel}>Rata-rata Durasi</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{item.jumlahKaliPending}</Text>
                  <Text style={styles.statLabel}>Kali Pending</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
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
  emptyText: {
    color: "#6b7280",
    paddingVertical: 8,
  },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  namaTeknisi: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#e5e7eb",
  },
  statLabel: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  statValue: {
    fontWeight: "700",
    fontSize: 16,
    color: "#2563eb",
  },
});
