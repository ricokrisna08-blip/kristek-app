import { useEffect, useState } from "react";
import {
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
import {
  createTiketWithAssignment,
  type NewTiketInput,
  type TiketJenis,
} from "../tiket/createTiketWithAssignment";
import {
  searchPelanggan,
  type PelangganListItem,
} from "../pelanggan/searchPelanggan";
import { listAccounts, type AccountListItem } from "../accounts/listAccounts";
import { listOdp, type OdpListItem } from "../odp/listOdp";
import { listPaket, type Paket } from "../paket/listPaket";
import { ConfirmModal } from "../components/ConfirmModal";
import { ScreenHeader } from "../components/ScreenHeader";
import { Dropdown } from "../components/Dropdown";
import type { UserProfile } from "../auth/profile";
import { canManageMikrotikUsername } from "../auth/permissions";

const JENIS_OPTIONS: { value: TiketJenis; label: string }[] = [
  { value: "instalasi", label: "Instalasi" },
  { value: "gangguan_komplain", label: "Laporan Pelanggan" },
  { value: "maintenance", label: "Maintenance" },
];

// tanggal_instalasi adalah kolom `date` murni ("YYYY-MM-DD"), sama pola
// dengan tanggal_mulai/tanggal_selesai Pengajuan Cuti -- ditambah
// "T00:00:00" supaya di-parse sebagai waktu lokal, bukan UTC.
function formatTanggal(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
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

type Props = {
  profile: UserProfile;
  onBack: () => void;
  onCreated: () => void;
};

export function CreateTiketScreen({ profile, onBack, onCreated }: Props) {
  const [jenis, setJenis] = useState<TiketJenis>("instalasi");

  // Laporan Pelanggan (gangguan_komplain): pilih Pelanggan lama.
  const [pelangganResults, setPelangganResults] = useState<PelangganListItem[]>([]);
  const [selectedPelanggan, setSelectedPelanggan] = useState<PelangganListItem | null>(
    null
  );
  const [keluhan, setKeluhan] = useState("");

  // Instalasi: data Pelanggan baru.
  const [namaBaru, setNamaBaru] = useState("");
  const [alamatBaru, setAlamatBaru] = useState("");
  const [noHpBaru, setNoHpBaru] = useState("");
  const [odpBaruId, setOdpBaruId] = useState<string | null>(null);
  const [paketBaruId, setPaketBaruId] = useState<string | null>(null);
  const [mikrotikUsernameBaru, setMikrotikUsernameBaru] = useState("");
  const [tanggalInstalasi, setTanggalInstalasi] = useState(() => toDateString(new Date()));
  const [isTanggalInstalasiPickerVisible, setIsTanggalInstalasiPickerVisible] = useState(false);

  // Maintenance: pilih ODP + deskripsi pekerjaan.
  const [maintenanceOdpId, setMaintenanceOdpId] = useState<string | null>(null);
  const [deskripsiPekerjaan, setDeskripsiPekerjaan] = useState("");

  const [odpList, setOdpList] = useState<OdpListItem[]>([]);
  const [paketList, setPaketList] = useState<Paket[]>([]);
  const [teknisiList, setTeknisiList] = useState<AccountListItem[]>([]);
  const [selectedTeknisiIds, setSelectedTeknisiIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [mikrotikWarning, setMikrotikWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  useEffect(() => {
    listAccounts(supabase).then((accounts) =>
      setTeknisiList(accounts.filter((a) => a.role === "teknisi"))
    );
    listOdp(supabase).then((result) => {
      setOdpList(result);
      setOdpBaruId((prev) => prev ?? result[0]?.id ?? null);
      setMaintenanceOdpId((prev) => prev ?? result[0]?.id ?? null);
    });
    listPaket(supabase).then((result) => {
      setPaketList(result);
      setPaketBaruId((prev) => prev ?? result[0]?.id ?? null);
    });
    searchPelanggan(supabase, "").then(setPelangganResults);
  }, []);

  function toggleTeknisi(id: string) {
    setSelectedTeknisiIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function handleChangeTanggalInstalasi(event: DateTimePickerEvent, selectedDate?: Date) {
    setIsTanggalInstalasiPickerVisible(false);
    if (event.type !== "set" || !selectedDate) return;
    setTanggalInstalasi(toDateString(selectedDate));
  }

  function buildInput(): NewTiketInput | null {
    if (!profile.wilayahId) return null;
    if (selectedTeknisiIds.length === 0) return null;

    const common = {
      wilayahId: profile.wilayahId,
      createdBy: profile.id,
      teknisiIds: selectedTeknisiIds,
    };

    if (jenis === "instalasi") {
      if (!namaBaru.trim() || !alamatBaru.trim() || !noHpBaru.trim()) return null;
      if (!odpBaruId || !paketBaruId) return null;
      if (!mikrotikUsernameBaru.trim()) return null;
      if (!tanggalInstalasi.trim()) return null;
      return {
        ...common,
        jenis: "instalasi",
        pelangganBaru: {
          nama: namaBaru,
          alamat: alamatBaru,
          noHp: noHpBaru,
          odpId: odpBaruId,
          paketId: paketBaruId,
          mikrotikUsername: mikrotikUsernameBaru.trim(),
          tanggalInstalasi,
        },
      };
    }

    if (jenis === "gangguan_komplain") {
      if (!selectedPelanggan || !keluhan.trim()) return null;
      return {
        ...common,
        jenis: "gangguan_komplain",
        pelangganId: selectedPelanggan.id,
        keluhan,
      };
    }

    if (!maintenanceOdpId || !deskripsiPekerjaan.trim()) return null;
    return {
      ...common,
      jenis: "maintenance",
      odpId: maintenanceOdpId,
      deskripsiPekerjaan,
    };
  }

  const input = buildInput();
  const canSubmit = input !== null;

  async function handleConfirm() {
    setError(null);
    const finalInput = buildInput();

    if (!finalInput) {
      setIsConfirmVisible(false);
      setError("Lengkapi semua field wajib terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    const result = await createTiketWithAssignment(supabase, finalInput);
    setIsSubmitting(false);

    if (!result.success) {
      setIsConfirmVisible(false);
      setError(result.error);
      return;
    }

    setIsConfirmVisible(false);

    if (result.mikrotikWarning) {
      setMikrotikWarning(result.mikrotikWarning);
      return;
    }

    onCreated();
  }

  const teknisiNames = teknisiList
    .filter((t) => selectedTeknisiIds.includes(t.id))
    .map((t) => t.nama)
    .join(", ");

  const jenisLabel = JENIS_OPTIONS.find((o) => o.value === jenis)?.label ?? jenis;
  const odpBaruLabel = odpList.find((o) => o.id === odpBaruId)?.label ?? "";
  const paketBaruNama = paketList.find((p) => p.id === paketBaruId)?.nama ?? "";
  const maintenanceOdpLabel = odpList.find((o) => o.id === maintenanceOdpId)?.label ?? "";

  function confirmFields() {
    if (jenis === "instalasi") {
      return [
        { label: "Jenis", value: jenisLabel },
        { label: "Nama Pelanggan Baru", value: namaBaru },
        { label: "Alamat", value: alamatBaru },
        { label: "No. HP", value: noHpBaru },
        { label: "ODP", value: odpBaruLabel || "-" },
        { label: "Paket", value: paketBaruNama || "-" },
        ...(canManageMikrotikUsername(profile.role)
          ? [{ label: "Username Mikrotik", value: mikrotikUsernameBaru.trim() }]
          : []),
        { label: "Tanggal Instalasi", value: formatTanggal(tanggalInstalasi) },
        { label: "Teknisi", value: teknisiNames },
      ];
    }
    if (jenis === "gangguan_komplain") {
      return [
        { label: "Jenis", value: jenisLabel },
        { label: "Pelanggan", value: selectedPelanggan?.nama ?? "-" },
        { label: "Keluhan", value: keluhan },
        { label: "Teknisi", value: teknisiNames },
      ];
    }
    return [
      { label: "Jenis", value: jenisLabel },
      { label: "ODP", value: maintenanceOdpLabel || "-" },
      { label: "Deskripsi Pekerjaan", value: deskripsiPekerjaan },
      { label: "Teknisi", value: teknisiNames },
    ];
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Buat Tiket Baru"
        subtitle="Isi detail Tiket sesuai jenis pekerjaan"
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.container}>
      {mikrotikWarning ? (
        <TouchableOpacity
          onPress={() => {
            setMikrotikWarning(null);
            onCreated();
          }}
        >
          <Text style={styles.warningBanner}>{mikrotikWarning} (ketuk untuk tutup)</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Jenis Tiket</Text>
        <Dropdown
          variant="field"
          title="Pilih Jenis Tiket"
          valueLabel={jenisLabel}
          options={JENIS_OPTIONS.map((option) => ({ id: option.value, label: option.label }))}
          onSelect={(value) => setJenis(value as TiketJenis)}
        />
      </View>

      {jenis === "instalasi" ? (
        <View style={styles.sectionCard}>
          <Text style={styles.subtitle}>Data Pelanggan Baru</Text>

          <Text style={styles.fieldLabel}>Nama</Text>
          <TextInput
            style={styles.input}
            placeholder="Nama Pelanggan"
            placeholderTextColor="#9ca3af"
            value={namaBaru}
            onChangeText={setNamaBaru}
          />

          <Text style={styles.fieldLabel}>Alamat</Text>
          <TextInput
            style={styles.input}
            placeholder="Alamat lengkap"
            placeholderTextColor="#9ca3af"
            value={alamatBaru}
            onChangeText={setAlamatBaru}
          />

          <Text style={styles.fieldLabel}>No. HP</Text>
          <TextInput
            style={styles.input}
            placeholder="08xxxxxxxxxx"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            value={noHpBaru}
            onChangeText={setNoHpBaru}
          />

          <Text style={styles.fieldLabel}>ODP</Text>
          {odpList.length === 0 ? (
            <Text style={styles.error}>Belum ada ODP — buat ODP dulu di Kelola ODP.</Text>
          ) : (
            <Dropdown
              variant="field"
              searchable
              title="Pilih ODP"
              valueLabel={odpBaruLabel}
              options={odpList.map((odp) => ({
                id: odp.id,
                label: odp.wilayahNama ? `${odp.label} (${odp.wilayahNama})` : odp.label,
              }))}
              onSelect={setOdpBaruId}
            />
          )}

          <Text style={styles.fieldLabel}>Paket</Text>
          {paketList.length === 0 ? (
            <Text style={styles.error}>
              Belum ada Paket — minta Pemilik menambah Paket dulu.
            </Text>
          ) : (
            <Dropdown
              variant="field"
              title="Pilih Paket"
              valueLabel={paketBaruNama}
              options={paketList.map((paket) => ({ id: paket.id, label: paket.nama }))}
              onSelect={setPaketBaruId}
            />
          )}

          {canManageMikrotikUsername(profile.role) ? (
            <>
              <Text style={styles.fieldLabel}>Username Mikrotik</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: budi01"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                value={mikrotikUsernameBaru}
                onChangeText={setMikrotikUsernameBaru}
              />
            </>
          ) : null}

          <Text style={styles.fieldLabel}>Tanggal Instalasi</Text>
          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setIsTanggalInstalasiPickerVisible(true)}
          >
            <Text style={styles.dateFieldText}>{formatTanggal(tanggalInstalasi)}</Text>
            <Text style={styles.dateFieldIcon}>📅</Text>
          </TouchableOpacity>
          {isTanggalInstalasiPickerVisible ? (
            <DateTimePicker
              value={parseDateString(tanggalInstalasi)}
              mode="date"
              display="default"
              onChange={handleChangeTanggalInstalasi}
            />
          ) : null}
        </View>
      ) : null}

      {jenis === "gangguan_komplain" ? (
        <View style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>Pelanggan</Text>
          {pelangganResults.length === 0 ? (
            <Text style={styles.error}>Belum ada Pelanggan.</Text>
          ) : (
            <Dropdown
              variant="field"
              searchable
              title="Pilih Pelanggan"
              valueLabel={
                selectedPelanggan
                  ? `${selectedPelanggan.nama} (${selectedPelanggan.nomorPelanggan})`
                  : ""
              }
              options={pelangganResults.map((item) => ({
                id: item.id,
                label: `${item.nama} (${item.nomorPelanggan})`,
              }))}
              onSelect={(id) =>
                setSelectedPelanggan(pelangganResults.find((item) => item.id === id) ?? null)
              }
            />
          )}

          <Text style={[styles.fieldLabel, styles.fieldLabelSpacing]}>Keluhan</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tulis keluhan Pelanggan"
            placeholderTextColor="#9ca3af"
            value={keluhan}
            onChangeText={setKeluhan}
            multiline
          />
        </View>
      ) : null}

      {jenis === "maintenance" ? (
        <View style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>ODP</Text>
          {odpList.length === 0 ? (
            <Text style={styles.error}>Belum ada ODP — buat ODP dulu di Kelola ODP.</Text>
          ) : (
            <Dropdown
              variant="field"
              searchable
              title="Pilih ODP"
              valueLabel={maintenanceOdpLabel}
              options={odpList.map((odp) => ({
                id: odp.id,
                label: odp.wilayahNama ? `${odp.label} (${odp.wilayahNama})` : odp.label,
              }))}
              onSelect={setMaintenanceOdpId}
            />
          )}

          <Text style={[styles.fieldLabel, styles.fieldLabelSpacing]}>Deskripsi Pekerjaan</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Misal: migrasi kabel ke ODC baru"
            placeholderTextColor="#9ca3af"
            value={deskripsiPekerjaan}
            onChangeText={setDeskripsiPekerjaan}
            multiline
          />
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.subtitle}>Teknisi (semua Wilayah)</Text>
        {teknisiList.length === 0 ? (
          <Text style={styles.error}>Belum ada akun Teknisi — buat dulu di Kelola Akun.</Text>
        ) : (
          <View style={styles.teknisiList}>
            {teknisiList.map((teknisi) => {
              const isSelected = selectedTeknisiIds.includes(teknisi.id);
              return (
                <TouchableOpacity
                  key={teknisi.id}
                  style={[styles.teknisiRow, isSelected && styles.teknisiRowSelected]}
                  onPress={() => toggleTeknisi(teknisi.id)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <View style={styles.teknisiInfo}>
                    <Text style={styles.teknisiName}>{teknisi.nama}</Text>
                    <Text style={styles.teknisiWilayah} numberOfLines={2}>
                      {teknisi.wilayahNama ?? "Wilayah tidak diketahui"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {error ? <Text style={[styles.error, styles.errorSpacing]}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={() => setIsConfirmVisible(true)}
        disabled={!canSubmit}
      >
        <Text style={styles.buttonText}>Buat Tiket</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={isConfirmVisible}
        title="Konfirmasi Tiket Baru"
        fields={confirmFields()}
        isSubmitting={isSubmitting}
        onCancel={() => setIsConfirmVisible(false)}
        onConfirm={handleConfirm}
      />
      </ScrollView>
    </View>
  );
}

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
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  fieldLabelSpacing: {
    marginTop: 4,
  },
  sectionCard: {
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
  dateFieldIcon: {
    fontSize: 15,
  },
  teknisiList: {
    gap: 8,
  },
  teknisiRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  teknisiRowSelected: {
    backgroundColor: "#EAF3F7",
    borderColor: "#1B7396",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  checkboxSelected: {
    backgroundColor: "#1B7396",
    borderColor: "#1B7396",
  },
  checkmark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  teknisiInfo: {
    flex: 1,
    flexShrink: 1,
  },
  teknisiName: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  teknisiWilayah: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  error: {
    color: "#DC2626",
    fontSize: 13,
  },
  warningBanner: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    fontSize: 12,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  errorSpacing: {
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#1B7396",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#1B7396",
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
});
