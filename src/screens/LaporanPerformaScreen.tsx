import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { getTeknisiPerformance } from "../tiket/getTeknisiPerformance";
import type { TeknisiPerformance } from "../tiket/computeTeknisiPerformance";
import { formatDurasiKerja } from "../tiket/durasiKerja";
import { ScreenHeader } from "../components/ScreenHeader";

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
      <ScreenHeader
        title="Laporan Performa Teknisi"
        subtitle={`${performaList.length} Teknisi`}
        onBack={onBack}
      />
      <View style={styles.body}>
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
    </View>
  );
}

const KRISTEK_TEAL = "#1B7396";
const KRISTEK_NAVY = "#0B2D5B";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  body: {
    flex: 1,
    padding: 24,
  },
  loading: {
    marginVertical: 12,
  },
  emptyText: {
    color: "#6b7280",
    paddingVertical: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
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
    backgroundColor: KRISTEK_TEAL,
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
    backgroundColor: "#E4E7EB",
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
    color: KRISTEK_TEAL,
  },
});
