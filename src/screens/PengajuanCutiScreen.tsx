import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { submitPengajuanCuti } from "../cuti/submitPengajuanCuti";
import { listPengajuanCuti, type PengajuanCutiItem } from "../cuti/listPengajuanCuti";
import { ConfirmModal } from "../components/ConfirmModal";
import { BackButton } from "../components/BackButton";
import type { UserProfile } from "../auth/profile";

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PengajuanCutiScreen({ profile, onBack }: Props) {
  const [riwayat, setRiwayat] = useState<PengajuanCutiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [alasan, setAlasan] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  async function reload() {
    setIsLoading(true);
    setRiwayat(await listPengajuanCuti(supabase));
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);
    const result = await submitPengajuanCuti(supabase, {
      teknisiId: profile.id,
      tanggalMulai,
      tanggalSelesai,
      alasan,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setIsConfirmVisible(false);
      setError(result.error);
      return;
    }

    setIsConfirmVisible(false);
    setTanggalMulai("");
    setTanggalSelesai("");
    setAlasan("");
    await reload();
  }

  const canSubmit = Boolean(tanggalMulai.trim() && tanggalSelesai.trim() && alasan.trim());

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton onPress={onBack} />

      <Text style={styles.title}>Ajukan Cuti/Izin</Text>
      <Text style={styles.count}>Isi form di bawah untuk mengajukan cuti/izin</Text>

      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Tanggal Mulai</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: 2026-08-20"
          placeholderTextColor="#9ca3af"
          value={tanggalMulai}
          onChangeText={setTanggalMulai}
        />

        <Text style={styles.fieldLabel}>Tanggal Selesai</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: 2026-08-22"
          placeholderTextColor="#9ca3af"
          value={tanggalSelesai}
          onChangeText={setTanggalSelesai}
        />

        <Text style={styles.fieldLabel}>Alasan</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tulis alasan cuti/izin"
          placeholderTextColor="#9ca3af"
          value={alasan}
          onChangeText={setAlasan}
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={() => setIsConfirmVisible(true)}
          disabled={!canSubmit}
        >
          <Text style={styles.buttonText}>Kirim Pengajuan</Text>
        </TouchableOpacity>

        <ConfirmModal
          visible={isConfirmVisible}
          title="Konfirmasi Pengajuan Cuti"
          fields={[
            { label: "Tanggal Mulai", value: tanggalMulai },
            { label: "Tanggal Selesai", value: tanggalSelesai },
            { label: "Alasan", value: alasan },
          ]}
          isSubmitting={isSubmitting}
          onCancel={() => setIsConfirmVisible(false)}
          onConfirm={handleConfirm}
        />
      </View>

      <Text style={styles.subtitle}>Riwayat Pengajuan Saya</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : riwayat.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada pengajuan cuti/izin.</Text>
      ) : (
        <View style={styles.list}>
          {riwayat.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardRange}>
                {formatTanggal(item.tanggalMulai)} — {formatTanggal(item.tanggalSelesai)}
              </Text>
              <Text style={styles.cardAlasan}>{item.alasan}</Text>
              <Text style={styles.cardDate}>Diajukan {formatTanggal(item.createdAt)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const KRISTEK_TEAL = "#1B7396";
const KRISTEK_NAVY = "#0B2D5B";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  subtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginTop: 20,
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111827",
    marginBottom: 12,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  error: {
    color: "#DC2626",
    marginBottom: 10,
  },
  button: {
    backgroundColor: KRISTEK_TEAL,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: KRISTEK_TEAL,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  loading: {
    marginVertical: 12,
  },
  emptyText: {
    color: "#6b7280",
    paddingVertical: 8,
  },
  list: {
    marginBottom: 4,
  },
  card: {
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
  cardRange: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
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
