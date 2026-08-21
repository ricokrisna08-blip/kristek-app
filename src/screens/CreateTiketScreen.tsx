import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
import { BackButton } from "../components/BackButton";
import { Dropdown } from "../components/Dropdown";
import type { UserProfile } from "../auth/profile";

const JENIS_OPTIONS: { value: TiketJenis; label: string }[] = [
  { value: "instalasi", label: "Instalasi" },
  { value: "gangguan_komplain", label: "Laporan Pelanggan" },
  { value: "maintenance", label: "Maintenance" },
];

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

  // Maintenance: pilih ODP + deskripsi pekerjaan.
  const [maintenanceOdpId, setMaintenanceOdpId] = useState<string | null>(null);
  const [deskripsiPekerjaan, setDeskripsiPekerjaan] = useState("");

  const [odpList, setOdpList] = useState<OdpListItem[]>([]);
  const [paketList, setPaketList] = useState<Paket[]>([]);
  const [teknisiList, setTeknisiList] = useState<AccountListItem[]>([]);
  const [selectedTeknisiIds, setSelectedTeknisiIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
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
      return {
        ...common,
        jenis: "instalasi",
        pelangganBaru: {
          nama: namaBaru,
          alamat: alamatBaru,
          noHp: noHpBaru,
          odpId: odpBaruId,
          paketId: paketBaruId,
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
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton onPress={onBack} />

      <Text style={styles.title}>Buat Tiket Baru</Text>
      <Text style={styles.count}>Isi detail Tiket sesuai jenis pekerjaan</Text>

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
          <View style={styles.chipRow}>
            {teknisiList.map((teknisi) => {
              const isSelected = selectedTeknisiIds.includes(teknisi.id);
              return (
                <TouchableOpacity
                  key={teknisi.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleTeknisi(teknisi.id)}
                >
                  <Text style={isSelected ? styles.chipTextSelected : styles.chipText}>
                    {teknisi.nama} ({teknisi.wilayahNama ?? "Wilayah tidak diketahui"})
                  </Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#F8FAFC",
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: "#1B7396",
    borderColor: "#1B7396",
  },
  chipText: {
    color: "#374151",
    fontSize: 13,
  },
  chipTextSelected: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  error: {
    color: "#DC2626",
    fontSize: 13,
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
