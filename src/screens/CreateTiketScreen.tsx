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
import type { UserProfile } from "../auth/profile";

const JENIS_OPTIONS: { value: TiketJenis; label: string }[] = [
  { value: "instalasi", label: "Instalasi" },
  { value: "gangguan_komplain", label: "Gangguan-Komplain" },
  { value: "maintenance", label: "Maintenance" },
];

type Props = {
  profile: UserProfile;
  onBack: () => void;
  onCreated: () => void;
};

export function CreateTiketScreen({ profile, onBack, onCreated }: Props) {
  const [jenis, setJenis] = useState<TiketJenis>("instalasi");

  // Gangguan-Komplain: cari Pelanggan lama.
  const [pelangganQuery, setPelangganQuery] = useState("");
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
  }, []);

  useEffect(() => {
    if (jenis === "gangguan_komplain") {
      searchPelanggan(supabase, pelangganQuery).then(setPelangganResults);
    }
  }, [jenis, pelangganQuery]);

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

  function confirmFields() {
    const jenisLabel = JENIS_OPTIONS.find((o) => o.value === jenis)?.label ?? jenis;
    if (jenis === "instalasi") {
      const odpLabel = odpList.find((o) => o.id === odpBaruId)?.label ?? "-";
      const paketNama = paketList.find((p) => p.id === paketBaruId)?.nama ?? "-";
      return [
        { label: "Jenis", value: jenisLabel },
        { label: "Nama Pelanggan Baru", value: namaBaru },
        { label: "Alamat", value: alamatBaru },
        { label: "No. HP", value: noHpBaru },
        { label: "ODP", value: odpLabel },
        { label: "Paket", value: paketNama },
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
    const odpLabel = odpList.find((o) => o.id === maintenanceOdpId)?.label ?? "-";
    return [
      { label: "Jenis", value: jenisLabel },
      { label: "ODP", value: odpLabel },
      { label: "Deskripsi Pekerjaan", value: deskripsiPekerjaan },
      { label: "Teknisi", value: teknisiNames },
    ];
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton onPress={onBack} />

      <Text style={styles.title}>Buat Tiket Baru</Text>

      <Text style={styles.subtitle}>Jenis</Text>
      <View style={styles.optionRow}>
        {JENIS_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              jenis === option.value && styles.optionSelected,
            ]}
            onPress={() => setJenis(option.value)}
          >
            <Text
              style={
                jenis === option.value
                  ? styles.optionTextSelected
                  : styles.optionText
              }
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {jenis === "instalasi" ? (
        <>
          <Text style={styles.subtitle}>Data Pelanggan Baru</Text>
          <TextInput
            style={styles.input}
            placeholder="Nama"
            value={namaBaru}
            onChangeText={setNamaBaru}
          />
          <TextInput
            style={styles.input}
            placeholder="Alamat"
            value={alamatBaru}
            onChangeText={setAlamatBaru}
          />
          <TextInput
            style={styles.input}
            placeholder="No. HP"
            keyboardType="phone-pad"
            value={noHpBaru}
            onChangeText={setNoHpBaru}
          />

          <Text style={styles.subtitle}>ODP</Text>
          <View style={styles.optionRow}>
            {odpList.map((odp) => (
              <TouchableOpacity
                key={odp.id}
                style={[
                  styles.option,
                  odpBaruId === odp.id && styles.optionSelected,
                ]}
                onPress={() => setOdpBaruId(odp.id)}
              >
                <Text
                  style={
                    odpBaruId === odp.id
                      ? styles.optionTextSelected
                      : styles.optionText
                  }
                >
                  {odp.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subtitle}>Paket</Text>
          <View style={styles.optionRow}>
            {paketList.map((paket) => (
              <TouchableOpacity
                key={paket.id}
                style={[
                  styles.option,
                  paketBaruId === paket.id && styles.optionSelected,
                ]}
                onPress={() => setPaketBaruId(paket.id)}
              >
                <Text
                  style={
                    paketBaruId === paket.id
                      ? styles.optionTextSelected
                      : styles.optionText
                  }
                >
                  {paket.nama}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      {jenis === "gangguan_komplain" ? (
        <>
          <Text style={styles.subtitle}>Pelanggan</Text>
          {selectedPelanggan ? (
            <View style={styles.selectedBox}>
              <Text>
                {selectedPelanggan.nama} ({selectedPelanggan.nomorPelanggan})
              </Text>
              <TouchableOpacity onPress={() => setSelectedPelanggan(null)}>
                <Text style={styles.changeLink}>Ganti</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Cari nama atau Nomor Pelanggan"
                value={pelangganQuery}
                onChangeText={setPelangganQuery}
              />
              <View style={styles.list}>
                {pelangganResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.listItem}
                    onPress={() => setSelectedPelanggan(item)}
                  >
                    <Text>
                      {item.nama} ({item.nomorPelanggan})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.subtitle}>Keluhan</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tulis keluhan Pelanggan"
            value={keluhan}
            onChangeText={setKeluhan}
            multiline
          />
        </>
      ) : null}

      {jenis === "maintenance" ? (
        <>
          <Text style={styles.subtitle}>ODP</Text>
          <View style={styles.optionRow}>
            {odpList.map((odp) => (
              <TouchableOpacity
                key={odp.id}
                style={[
                  styles.option,
                  maintenanceOdpId === odp.id && styles.optionSelected,
                ]}
                onPress={() => setMaintenanceOdpId(odp.id)}
              >
                <Text
                  style={
                    maintenanceOdpId === odp.id
                      ? styles.optionTextSelected
                      : styles.optionText
                  }
                >
                  {odp.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subtitle}>Deskripsi Pekerjaan</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Misal: migrasi kabel ke ODC baru"
            value={deskripsiPekerjaan}
            onChangeText={setDeskripsiPekerjaan}
            multiline
          />
        </>
      ) : null}

      <Text style={styles.subtitle}>Teknisi (semua Wilayah)</Text>
      {teknisiList.length === 0 ? (
        <Text style={styles.error}>
          Belum ada akun Teknisi — buat dulu di Kelola Akun.
        </Text>
      ) : (
        <View style={styles.optionRow}>
          {teknisiList.map((teknisi) => (
            <TouchableOpacity
              key={teknisi.id}
              style={[
                styles.option,
                selectedTeknisiIds.includes(teknisi.id) && styles.optionSelected,
              ]}
              onPress={() => toggleTeknisi(teknisi.id)}
            >
              <Text
                style={
                  selectedTeknisiIds.includes(teknisi.id)
                    ? styles.optionTextSelected
                    : styles.optionText
                }
              >
                {teknisi.nama} ({teknisi.wilayahNama ?? "Wilayah tidak diketahui"})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

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
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginTop: 18,
    marginBottom: 8,
  },
  selectedBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
  },
  changeLink: {
    color: "#2563eb",
    fontWeight: "600",
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
    marginBottom: 10,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  list: {
    marginBottom: 4,
  },
  listItem: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  optionSelected: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  optionText: {
    color: "#374151",
    fontSize: 13,
  },
  optionTextSelected: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  error: {
    color: "#c0392b",
    marginTop: 8,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#2563eb",
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
