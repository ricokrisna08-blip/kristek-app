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
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { supabase } from "../lib/supabase";
import { submitPengajuanCuti } from "../cuti/submitPengajuanCuti";
import { listPengajuanCuti, type PengajuanCutiItem } from "../cuti/listPengajuanCuti";
import { ConfirmModal } from "../components/ConfirmModal";
import { ScreenHeader } from "../components/ScreenHeader";
import type { UserProfile } from "../auth/profile";

type Props = {
  profile: UserProfile;
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

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateString(value: string): Date {
  return value ? new Date(`${value}T00:00:00`) : new Date();
}

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
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
  const [isMulaiPickerVisible, setIsMulaiPickerVisible] = useState(false);
  const [isSelesaiPickerVisible, setIsSelesaiPickerVisible] = useState(false);

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
      teknisiNama: profile.nama,
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

  function handleChangeMulai(event: DateTimePickerEvent, selectedDate?: Date) {
    setIsMulaiPickerVisible(false);
    if (event.type !== "set" || !selectedDate) return;

    const value = toDateString(selectedDate);
    setTanggalMulai(value);
    if (tanggalSelesai && tanggalSelesai < value) {
      setTanggalSelesai(value);
    }
  }

  function handleChangeSelesai(event: DateTimePickerEvent, selectedDate?: Date) {
    setIsSelesaiPickerVisible(false);
    if (event.type !== "set" || !selectedDate) return;
    setTanggalSelesai(toDateString(selectedDate));
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Ajukan Cuti/Izin"
        subtitle="Isi form di bawah untuk mengajukan cuti/izin"
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Tanggal Mulai</Text>
        <TouchableOpacity style={styles.dateField} onPress={() => setIsMulaiPickerVisible(true)}>
          <Text style={tanggalMulai ? styles.dateFieldText : styles.dateFieldPlaceholder}>
            {tanggalMulai ? formatTanggal(tanggalMulai) : "Pilih tanggal mulai"}
          </Text>
          <Text style={styles.dateFieldIcon}>📅</Text>
        </TouchableOpacity>
        {isMulaiPickerVisible ? (
          <DateTimePicker
            value={parseDateString(tanggalMulai)}
            mode="date"
            display="default"
            minimumDate={startOfToday()}
            onChange={handleChangeMulai}
          />
        ) : null}

        <Text style={styles.fieldLabel}>Tanggal Selesai</Text>
        <TouchableOpacity
          style={styles.dateField}
          onPress={() => setIsSelesaiPickerVisible(true)}
        >
          <Text style={tanggalSelesai ? styles.dateFieldText : styles.dateFieldPlaceholder}>
            {tanggalSelesai ? formatTanggal(tanggalSelesai) : "Pilih tanggal selesai"}
          </Text>
          <Text style={styles.dateFieldIcon}>📅</Text>
        </TouchableOpacity>
        {isSelesaiPickerVisible ? (
          <DateTimePicker
            value={parseDateString(tanggalSelesai || tanggalMulai)}
            mode="date"
            display="default"
            minimumDate={parseDateString(tanggalMulai || toDateString(startOfToday()))}
            onChange={handleChangeSelesai}
          />
        ) : null}

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
              <Text style={styles.cardDate}>Diajukan {formatWaktuDiajukan(item.createdAt)}</Text>
            </View>
          ))}
        </View>
      )}
      </ScrollView>
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
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#F8FAFC",
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
  dateField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  dateFieldText: {
    fontSize: 15,
    color: "#111827",
  },
  dateFieldPlaceholder: {
    fontSize: 15,
    color: "#9ca3af",
  },
  dateFieldIcon: {
    fontSize: 15,
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
