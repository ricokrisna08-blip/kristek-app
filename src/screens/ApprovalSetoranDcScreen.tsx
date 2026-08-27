import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { listPendingSetoranDc, type PendingSetoranDc } from "../pelanggan/listPendingSetoranDc";
import { approveSetoranDc } from "../pelanggan/approveSetoranDc";
import { rejectSetoranDc } from "../pelanggan/rejectSetoranDc";
import { ScreenHeader } from "../components/ScreenHeader";

type Props = {
  onBack: () => void;
};

function formatHarga(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApprovalSetoranDcScreen({ onBack }: Props) {
  const [items, setItems] = useState<PendingSetoranDc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    const result = await listPendingSetoranDc(supabase);
    setItems(result);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    reload().then(() => setIsLoading(false));
  }, [reload]);

  async function handleApprove(id: string) {
    setProcessingId(id);
    setErrorById((prev) => ({ ...prev, [id]: "" }));
    const result = await approveSetoranDc(supabase, id);
    setProcessingId(null);

    if (!result.success) {
      setErrorById((prev) => ({ ...prev, [id]: result.error }));
      return;
    }

    await reload();
  }

  async function handleReject(id: string) {
    setProcessingId(id);
    setErrorById((prev) => ({ ...prev, [id]: "" }));
    const result = await rejectSetoranDc(supabase, id);
    setProcessingId(null);

    if (!result.success) {
      setErrorById((prev) => ({ ...prev, [id]: result.error }));
      return;
    }

    await reload();
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Approval Setoran DC"
        subtitle={`${items.length} setoran menunggu approval`}
        onBack={onBack}
      />
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Tidak ada setoran DC yang menunggu approval.</Text>
            }
            renderItem={({ item }) => {
              const isProcessing = processingId === item.id;
              return (
                <View style={styles.card}>
                  <Text style={styles.cardName}>{item.nama}</Text>
                  <Text style={styles.cardAlamat}>{item.alamat}</Text>
                  <Text style={styles.cardHarga}>{formatHarga(item.tagihan)}</Text>
                  <Text style={styles.cardMeta}>
                    Dicentang oleh {item.dcNama} · {formatWaktu(item.flaggedAt)}
                  </Text>

                  {errorById[item.id] ? (
                    <Text style={styles.error}>{errorById[item.id]}</Text>
                  ) : null}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.button, styles.rejectButton]}
                      onPress={() => handleReject(item.id)}
                      disabled={isProcessing}
                    >
                      <Text style={styles.rejectButtonText}>Tolak</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.approveButton]}
                      onPress={() => handleApprove(item.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.approveButtonText}>Setujui</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const KRISTEK_TEAL = "#1B7396";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    padding: 16,
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
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 14,
    marginBottom: 10,
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
    color: KRISTEK_TEAL,
    marginTop: 6,
  },
  cardMeta: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: "#FEE2E2",
  },
  rejectButtonText: {
    color: "#DC2626",
    fontWeight: "600",
  },
  approveButton: {
    backgroundColor: KRISTEK_TEAL,
  },
  approveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
