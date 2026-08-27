import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { createWaBlastJob } from "../wablast/createWaBlastJob";
import { countBelumBayar } from "../wablast/countBelumBayar";
import { listWaBlastJobs, type WaBlastJobItem, type WaBlastJobStatus } from "../wablast/listWaBlastJobs";
import {
  listBelumBayarUntukWaBlast,
  type PelangganBelumBayarWaBlast,
} from "../pelanggan/listBelumBayarUntukWaBlast";
import type { UserProfile } from "../auth/profile";
import { ScreenHeader } from "../components/ScreenHeader";

function formatHarga(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

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

  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isLoadingPicker, setIsLoadingPicker] = useState(false);
  const [pickerItems, setPickerItems] = useState<PelangganBelumBayarWaBlast[]>([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectedConfirmVisible, setIsSelectedConfirmVisible] = useState(false);
  const [isSendingSelected, setIsSendingSelected] = useState(false);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

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

  async function handleManualReload() {
    setIsReloading(true);
    await reload();
    setIsReloading(false);
  }

  async function handleOpenPicker() {
    setSelectedError(null);
    setSelectedIds(new Set());
    setPickerSearch("");
    setIsPickerVisible(true);
    setIsLoadingPicker(true);
    const result = await listBelumBayarUntukWaBlast(supabase);
    setPickerItems(result);
    setIsLoadingPicker(false);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleConfirmSendSelected() {
    setSelectedError(null);
    setIsSendingSelected(true);
    const result = await createWaBlastJob(supabase, profile.id, [...selectedIds]);
    setIsSendingSelected(false);

    if (!result.success) {
      setSelectedError(result.error);
      return;
    }

    setIsSelectedConfirmVisible(false);
    setIsPickerVisible(false);
    await reload();
  }

  const filteredPickerItems = useMemo(() => {
    const query = pickerSearch.trim().toLowerCase();
    if (!query) return pickerItems;
    return pickerItems.filter((item) => item.nama.toLowerCase().includes(query));
  }, [pickerItems, pickerSearch]);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Blast Tagihan WhatsApp"
        subtitle="Kirim reminder tagihan WA ke semua Pelanggan yang belum bayar & belum dikirimi bulan ini. Diproses oleh daemon di laptop, juga jalan otomatis tiap tanggal 1 jam 09:00."
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

      <TouchableOpacity
        style={[styles.buttonSecondary, hasActiveJob && styles.buttonDisabled]}
        onPress={handleOpenPicker}
        disabled={hasActiveJob}
      >
        <Text style={styles.buttonSecondaryText}>Pilih Pelanggan...</Text>
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

      <Modal
        visible={isPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <View style={styles.pickerBackdrop}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Pilih Pelanggan</Text>
              <TouchableOpacity onPress={() => setIsPickerVisible(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama Pelanggan"
                placeholderTextColor="#9ca3af"
                value={pickerSearch}
                onChangeText={setPickerSearch}
              />
            </View>

            {isLoadingPicker ? (
              <ActivityIndicator style={styles.loading} />
            ) : (
              <FlatList
                style={styles.pickerList}
                data={filteredPickerItems}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    {pickerSearch
                      ? "Tidak ada Pelanggan yang cocok."
                      : "Semua Pelanggan sudah bayar bulan ini."}
                  </Text>
                }
                renderItem={({ item }) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <TouchableOpacity
                      style={styles.pickerRow}
                      onPress={() => toggleSelected(item.id)}
                    >
                      <View
                        style={[styles.checkbox, isSelected && styles.checkboxChecked]}
                      >
                        {isSelected ? <Text style={styles.checkboxMark}>✓</Text> : null}
                      </View>
                      <View style={styles.pickerRowBody}>
                        <Text style={styles.pickerRowName}>{item.nama}</Text>
                        <Text style={styles.pickerRowHarga}>{formatHarga(item.tagihan)}</Text>
                      </View>
                      {item.sudahDiblastBulanIni ? (
                        <View style={styles.sentBadge}>
                          <Text style={styles.sentBadgeText}>Sudah dikirim</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity
              style={[styles.button, selectedIds.size === 0 && styles.buttonDisabled]}
              onPress={() => setIsSelectedConfirmVisible(true)}
              disabled={selectedIds.size === 0}
            >
              <Text style={styles.buttonText}>Kirim ke {selectedIds.size} Pelanggan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isSelectedConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSelectedConfirmVisible(false)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Kirim ke {selectedIds.size} Pelanggan terpilih?</Text>
            <Text style={styles.confirmSubtitle}>
              Pesan tagihan WhatsApp akan dikirim ke {selectedIds.size} Pelanggan yang kamu
              pilih, begitu daemon di laptop memprosesnya -- termasuk yang sudah pernah
              dikirimi bulan ini kalau kamu tetap pilih (resend manual). Tindakan ini tidak
              bisa dibatalkan setelah dikonfirmasi.
            </Text>

            {selectedError ? <Text style={styles.error}>{selectedError}</Text> : null}

            <View style={styles.confirmButtonRow}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmCancelButton]}
                onPress={() => setIsSelectedConfirmVisible(false)}
                disabled={isSendingSelected}
              >
                <Text style={styles.confirmCancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmSendButton]}
                onPress={handleConfirmSendSelected}
                disabled={isSendingSelected}
              >
                {isSendingSelected ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmSendButtonText}>Ya, Kirim Sekarang</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.subtitleRow}>
        <Text style={styles.subtitle}>Riwayat Blast</Text>
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={handleManualReload}
          disabled={isReloading}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isReloading ? (
            <ActivityIndicator size="small" color="#1B7396" />
          ) : (
            <Text style={styles.reloadButtonText}>🔄 Reload</Text>
          )}
        </TouchableOpacity>
      </View>

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
              {item.pelangganIdsCount != null ? (
                <Text style={styles.cardTargeted}>
                  {item.pelangganIdsCount} Pelanggan terpilih (manual)
                </Text>
              ) : null}
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
  buttonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: KRISTEK_TEAL,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonSecondaryText: {
    color: KRISTEK_TEAL,
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
  subtitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: KRISTEK_NAVY,
  },
  reloadButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  reloadButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B7396",
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
  cardTargeted: {
    fontSize: 11,
    color: KRISTEK_TEAL,
    marginTop: 4,
    fontWeight: "600",
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "85%",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  pickerClose: {
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "700",
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
  pickerList: {
    flex: 1,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  pickerRowBody: {
    flex: 1,
    marginLeft: 12,
  },
  pickerRowName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  pickerRowHarga: {
    fontSize: 12,
    color: KRISTEK_TEAL,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: KRISTEK_TEAL,
    borderColor: KRISTEK_TEAL,
  },
  checkboxMark: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  sentBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  sentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#92400E",
  },
});
