import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { createWaBlastJob } from "../wablast/createWaBlastJob";
import { countBelumBayar } from "../wablast/countBelumBayar";
import { listWaBlastJobs, type WaBlastJobItem, type WaBlastJobStatus } from "../wablast/listWaBlastJobs";
import type { UserProfile } from "../auth/profile";
import { ScreenHeader } from "../components/ScreenHeader";

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

const POLL_INTERVAL_MS = 4000;

const STATUS_LABEL: Record<WaBlastJobStatus, string> = {
  pending: "Menunggu",
  running: "Sedang mengirim",
  done: "Selesai",
  failed: "Gagal",
};

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WaBlastScreen({ profile, onBack }: Props) {
  const [jobs, setJobs] = useState<WaBlastJobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isCountingConfirm, setIsCountingConfirm] = useState(false);
  const [confirmCount, setConfirmCount] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function reload() {
    const result = await listWaBlastJobs(supabase);
    setJobs(result);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActiveJob = jobs.some((j) => j.status === "pending" || j.status === "running");

  // Selagi ada job pending/running, polling tiap beberapa detik biar
  // progress-nya (sent_count/total) keliatan jalan live -- daemon di
  // laptop yang update baris-nya, app cuma baca ulang secara berkala.
  useEffect(() => {
    if (hasActiveJob) {
      pollRef.current = setInterval(reload, POLL_INTERVAL_MS);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveJob]);

  // Dua langkah sengaja dipisah: tombol utama cuma HITUNG dulu berapa
  // Pelanggan yang bakal kena kirim (belum tentu langsung kirim), baru
  // modal konfirmasi yang benar-benar men-trigger job-nya -- supaya nggak
  // ada pesan WA beneran yang terkirim gara-gara kepencet nggak sengaja.
  async function handleOpenConfirm() {
    setTriggerError(null);
    setIsCountingConfirm(true);
    const count = await countBelumBayar(supabase);
    setIsCountingConfirm(false);
    setConfirmCount(count);
    setIsConfirmVisible(true);
  }

  async function handleConfirmTrigger() {
    setTriggerError(null);
    setIsTriggering(true);
    const result = await createWaBlastJob(supabase, profile.id);
    setIsTriggering(false);

    if (!result.success) {
      setTriggerError(result.error);
      return;
    }

    setIsConfirmVisible(false);
    await reload();
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Blast Tagihan WhatsApp"
        subtitle="Kirim reminder tagihan WA ke Pelanggan yang belum bayar bulan ini. Diproses oleh daemon di laptop, juga jalan otomatis tiap tanggal 1 jam 09:00."
        onBack={onBack}
      />
      <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, (isCountingConfirm || hasActiveJob) && styles.buttonDisabled]}
        onPress={handleOpenConfirm}
        disabled={isCountingConfirm || hasActiveJob}
      >
        <Text style={styles.buttonText}>
          {isCountingConfirm
            ? "Menghitung..."
            : hasActiveJob
            ? "Masih ada blast berjalan..."
            : "Kirim Blast Tagihan Sekarang"}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsConfirmVisible(false)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>
              {confirmCount === 0
                ? "Tidak ada Pelanggan yang belum bayar"
                : `Kirim ke ${confirmCount} Pelanggan?`}
            </Text>
            <Text style={styles.confirmSubtitle}>
              {confirmCount === 0
                ? "Semua Pelanggan sudah tercatat lunas bulan ini -- tidak ada yang perlu dikirimi reminder."
                : `Pesan tagihan WhatsApp akan langsung dikirim ke ${confirmCount} Pelanggan yang statusnya belum bayar bulan ini, begitu daemon di laptop memprosesnya. Tindakan ini tidak bisa dibatalkan setelah dikonfirmasi.`}
            </Text>

            {triggerError ? <Text style={styles.error}>{triggerError}</Text> : null}

            <View style={styles.confirmButtonRow}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmCancelButton]}
                onPress={() => setIsConfirmVisible(false)}
                disabled={isTriggering}
              >
                <Text style={styles.confirmCancelButtonText}>Batal</Text>
              </TouchableOpacity>
              {confirmCount !== 0 ? (
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmSendButton]}
                  onPress={handleConfirmTrigger}
                  disabled={isTriggering}
                >
                  {isTriggering ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmSendButtonText}>Ya, Kirim Sekarang</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      <Text style={styles.subtitle}>Riwayat Blast</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          style={styles.list}
          data={jobs}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada riwayat blast.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardMode}>{item.mode}</Text>
                <View style={[styles.badge, styles[`badge_${item.status}` as const]]}>
                  <Text style={styles.badgeText}>{STATUS_LABEL[item.status]}</Text>
                </View>
              </View>
              <Text style={styles.cardProgress}>
                {item.sentCount}/{item.total} terkirim
                {item.failedCount > 0 ? ` · ${item.failedCount} gagal` : ""}
              </Text>
              {item.error ? <Text style={styles.cardError}>{item.error}</Text> : null}
              <Text style={styles.cardDate}>Dibuat {formatWaktu(item.createdAt)}</Text>
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
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    padding: 24,
  },
  error: {
    color: "#DC2626",
    marginBottom: 10,
  },
  button: {
    backgroundColor: KRISTEK_TEAL,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confirmCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  confirmSubtitle: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 12,
  },
  confirmButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmCancelButton: {
    backgroundColor: "#f1f1f1",
  },
  confirmCancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  confirmSendButton: {
    backgroundColor: "#DC2626",
  },
  confirmSendButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: KRISTEK_NAVY,
    marginBottom: 10,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    textTransform: "capitalize",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badge_pending: {
    backgroundColor: "#FEF3C7",
  },
  badge_running: {
    backgroundColor: "#E7F1F5",
  },
  badge_done: {
    backgroundColor: "#DCFCE7",
  },
  badge_failed: {
    backgroundColor: "#FEE2E2",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
  },
  cardProgress: {
    fontSize: 13,
    color: "#374151",
    marginTop: 6,
  },
  cardError: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
  },
  cardDate: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 6,
  },
});
