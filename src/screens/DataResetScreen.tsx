import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";
import { deleteAllTiket } from "../tiket/deleteAllTiket";
import { countAllTiket } from "../tiket/countAllTiket";
import { deleteAllNotifikasi } from "../notifikasi/deleteAllNotifikasi";
import { countAllNotifikasi } from "../notifikasi/countAllNotifikasi";
import { ScreenHeader } from "../components/ScreenHeader";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";

type Props = {
  onBack: () => void;
};

type Target = "tiket" | "notifikasi";

export function DataResetScreen({ onBack }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [tiketCount, setTiketCount] = useState(0);
  const [notifikasiCount, setNotifikasiCount] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<Target | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function reload() {
    setIsLoading(true);
    const [tiket, notifikasi] = await Promise.all([
      countAllTiket(supabase),
      countAllNotifikasi(supabase),
    ]);
    setTiketCount(tiket);
    setNotifikasiCount(notifikasi);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    setIsDeleting(true);

    const result =
      deleteTarget === "tiket"
        ? await deleteAllTiket(supabase)
        : await deleteAllNotifikasi(supabase);
    setIsDeleting(false);

    if (!result.success) {
      setDeleteError(result.error);
      return;
    }

    setDeleteTarget(null);
    await reload();
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Reset Data"
        subtitle="Hapus permanen seluruh data Tiket atau Notifikasi -- tindakan ini tidak bisa dibatalkan."
        onBack={onBack}
      />
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Semua Tiket</Text>
              <Text style={styles.cardCount}>{tiketCount} Tiket tersimpan</Text>
              <Text style={styles.cardDetail}>
                Ikut terhapus: assignment Teknisi, foto/bukti, riwayat status, dan notifikasi
                yang terkait ke Tiket. Data Pelanggan TIDAK ikut terhapus.
              </Text>
              <TouchableOpacity
                style={[styles.dangerButton, tiketCount === 0 && styles.buttonDisabled]}
                onPress={() => {
                  setDeleteError(null);
                  setDeleteTarget("tiket");
                }}
                disabled={tiketCount === 0}
              >
                <Text style={styles.dangerButtonText}>Hapus Semua Tiket</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Semua Notifikasi</Text>
              <Text style={styles.cardCount}>{notifikasiCount} Notifikasi tersimpan</Text>
              <Text style={styles.cardDetail}>
                Termasuk notifikasi Tiket dan Pengajuan Cuti milik semua pengguna.
              </Text>
              <TouchableOpacity
                style={[styles.dangerButton, notifikasiCount === 0 && styles.buttonDisabled]}
                onPress={() => {
                  setDeleteError(null);
                  setDeleteTarget("notifikasi");
                }}
                disabled={notifikasiCount === 0}
              >
                <Text style={styles.dangerButtonText}>Hapus Semua Notifikasi</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <DeleteConfirmModal
          visible={deleteTarget !== null}
          itemLabel={deleteTarget === "tiket" ? `${tiketCount} Tiket` : `${notifikasiCount} Notifikasi`}
          error={deleteError}
          isDeleting={isDeleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
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
    padding: 24,
  },
  loading: {
    marginVertical: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 16,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  cardCount: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  cardDetail: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 8,
    lineHeight: 17,
  },
  dangerButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
    shadowColor: "#DC2626",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  dangerButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
