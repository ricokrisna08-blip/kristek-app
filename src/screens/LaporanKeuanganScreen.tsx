import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { getLaporanKeuangan, type LaporanBulananItem } from "../laporan/getLaporanKeuangan";
import { ScreenHeader } from "../components/ScreenHeader";

type Props = {
  onBack: () => void;
};

function formatAngka(value: number): string {
  return value.toLocaleString("en-US");
}

const COL = {
  bulan: 70,
  totalUser: 74,
  omset: 108,
  sudahBayar: 108,
  belumBayar: 108,
  persen: 60,
};

export function LaporanKeuanganScreen({ onBack }: Props) {
  const [items, setItems] = useState<LaporanBulananItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLaporanKeuangan(supabase).then((result) => {
      setItems(result);
      setIsLoading(false);
    });
  }, []);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Laporan Keuangan"
        subtitle={`${items.length} bulan tercatat`}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <View style={styles.sectionCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={[styles.row, styles.headerRow]}>
                <Text style={[styles.headerCell, { width: COL.bulan }]}>Bulan</Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.totalUser }]}>
                  Total User
                </Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.omset }]}>
                  Omset
                </Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.sudahBayar }]}>
                  Sudah Bayar
                </Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.belumBayar }]}>
                  Belum Bayar
                </Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.persen }]}>%</Text>
              </View>

              {items.map((item) => (
                <View
                  key={item.periode}
                  style={[styles.row, item.isBulanIni && styles.rowCurrent]}
                >
                  <View style={[styles.cellWrap, { width: COL.bulan }]}>
                    <Text style={styles.cellBulan}>{item.label}</Text>
                    {item.isBulanIni ? (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Bulan ini</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.cell, styles.numCell, { width: COL.totalUser }]}>
                    {item.totalUser}
                  </Text>
                  <Text style={[styles.cell, styles.cellBold, styles.numCell, { width: COL.omset }]}>
                    {formatAngka(item.omset)}
                  </Text>
                  <Text
                    style={[styles.cell, styles.cellSuccess, styles.numCell, { width: COL.sudahBayar }]}
                  >
                    {item.sudahBayar > 0 ? formatAngka(item.sudahBayar) : "-"}
                  </Text>
                  <Text
                    style={[styles.cell, styles.cellDanger, styles.numCell, { width: COL.belumBayar }]}
                  >
                    {item.belumBayar > 0 ? formatAngka(item.belumBayar) : "-"}
                  </Text>
                  <Text style={[styles.cell, styles.numCell, { width: COL.persen }]}>
                    {item.persen % 1 === 0 ? item.persen : item.persen.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
      </ScrollView>
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
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  loading: {
    marginVertical: 12,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerRow: {
    borderBottomWidth: 2,
    borderBottomColor: "#E4E7EB",
  },
  rowCurrent: {
    backgroundColor: "#E7F1F5",
    borderRadius: 8,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: "700",
    color: KRISTEK_NAVY,
  },
  cellWrap: {
    paddingRight: 8,
  },
  cell: {
    fontSize: 13,
    color: "#111827",
    paddingRight: 8,
  },
  cellBulan: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  cellBold: {
    fontWeight: "700",
  },
  cellSuccess: {
    color: "#059669",
    fontWeight: "600",
  },
  cellDanger: {
    color: "#DC2626",
    fontWeight: "600",
  },
  numCell: {
    textAlign: "right",
  },
  currentBadge: {
    marginTop: 3,
    backgroundColor: KRISTEK_TEAL,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: "flex-start",
  },
  currentBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
});
