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
import { createPelanggan } from "../pelanggan/createPelanggan";
import { searchPelanggan, type PelangganListItem } from "../pelanggan/searchPelanggan";
import {
  getPelangganDetail,
  type PelangganDetail,
} from "../pelanggan/getPelangganDetail";
import { listOdp, type OdpListItem } from "../odp/listOdp";
import { listPaket, type Paket } from "../paket/listPaket";
import { deletePelanggan } from "../pelanggan/deletePelanggan";
import { canCreatePelanggan, canDeletePelanggan } from "../auth/permissions";
import type { UserProfile } from "../auth/profile";
import { ConfirmModal } from "../components/ConfirmModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { BackButton } from "../components/BackButton";

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

export function PelangganManagementScreen({ profile, onBack }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PelangganListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [odpList, setOdpList] = useState<OdpListItem[]>([]);
  const [paketList, setPaketList] = useState<Paket[]>([]);

  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [noHp, setNoHp] = useState("");
  const [odpId, setOdpId] = useState<string | null>(null);
  const [paketId, setPaketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const [selectedDetail, setSelectedDetail] = useState<PelangganDetail | null>(
    null
  );

  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function reload() {
    setIsLoading(true);
    const [searchResult, odpResult, paketResult] = await Promise.all([
      searchPelanggan(supabase, query),
      listOdp(supabase),
      listPaket(supabase),
    ]);
    setResults(searchResult);
    setOdpList(odpResult);
    setPaketList(paketResult);
    setOdpId((prev) => prev ?? odpResult[0]?.id ?? null);
    setPaketId((prev) => prev ?? paketResult[0]?.id ?? null);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleConfirm() {
    setError(null);

    if (!profile.wilayahId) {
      setIsConfirmVisible(false);
      setError("Akun Anda belum punya Wilayah — hubungi Pemilik.");
      return;
    }
    if (!odpId) {
      setIsConfirmVisible(false);
      setError("Belum ada ODP di Wilayah Anda — buat ODP dulu.");
      return;
    }
    if (!paketId) {
      setIsConfirmVisible(false);
      setError("Belum ada Paket — minta Pemilik menambah Paket dulu.");
      return;
    }

    setIsSubmitting(true);
    const result = await createPelanggan(supabase, {
      nama,
      alamat,
      noHp,
      wilayahId: profile.wilayahId,
      odpId,
      paketId,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setIsConfirmVisible(false);
      setError(result.error);
      return;
    }

    setIsConfirmVisible(false);
    setNama("");
    setAlamat("");
    setNoHp("");
    await reload();
  }

  const selectedOdpLabel = odpList.find((o) => o.id === odpId)?.label ?? "-";
  const selectedPaketNama = paketList.find((p) => p.id === paketId)?.nama ?? "-";

  async function handleSelect(item: PelangganListItem) {
    const detail = await getPelangganDetail(supabase, item.id);
    setSelectedDetail(detail);
  }

  async function handleDeletePelanggan() {
    if (!selectedDetail) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deletePelanggan(supabase, selectedDetail.id);
    setIsDeleting(false);

    if (!result.success) {
      setDeleteError(result.error);
      return;
    }

    setIsDeleteConfirmVisible(false);
    setSelectedDetail(null);
    await reload();
  }

  if (selectedDetail) {
    const detailFields = [
      { label: "Nomor Pelanggan", value: selectedDetail.nomorPelanggan },
      { label: "Alamat", value: selectedDetail.alamat },
      { label: "No. HP", value: selectedDetail.noHp },
      { label: "Wilayah", value: selectedDetail.wilayahNama ?? "-" },
      { label: "ODP asal", value: selectedDetail.odpLabel ?? "-" },
      { label: "Paket", value: selectedDetail.paketNama ?? "-" },
    ];

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <BackButton onPress={() => setSelectedDetail(null)} label="Kembali ke daftar" />

        <View style={styles.detailHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {selectedDetail.nama.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.title}>{selectedDetail.nama}</Text>
        </View>

        <View style={styles.infoCard}>
          {detailFields.map((field, index) => (
            <View
              key={field.label}
              style={[
                styles.infoRow,
                index === detailFields.length - 1 && styles.infoRowLast,
              ]}
            >
              <Text style={styles.infoLabel}>{field.label}</Text>
              <Text style={styles.infoValue}>{field.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.subtitle}>Riwayat Tiket</Text>
        <Text style={styles.emptyText}>Belum ada Tiket.</Text>

        {canDeletePelanggan(profile.role) ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              setDeleteError(null);
              setIsDeleteConfirmVisible(true);
            }}
          >
            <Text style={styles.deleteButtonText}>Hapus Pelanggan</Text>
          </TouchableOpacity>
        ) : null}

        <DeleteConfirmModal
          visible={isDeleteConfirmVisible}
          itemLabel={selectedDetail.nama}
          error={deleteError}
          isDeleting={isDeleting}
          onCancel={() => setIsDeleteConfirmVisible(false)}
          onConfirm={handleDeletePelanggan}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton onPress={onBack} />

      <Text style={styles.title}>Manajemen Pelanggan</Text>
      <Text style={styles.count}>{results.length} Pelanggan ditemukan</Text>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama atau Nomor Pelanggan"
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : results.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada Pelanggan.</Text>
      ) : (
        <View style={styles.list}>
          {results.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => handleSelect(item)}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>
                  {item.nama.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{item.nama}</Text>
                <Text style={styles.cardDetail}>{item.nomorPelanggan}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {canCreatePelanggan(profile.role) ? (
        <>
          <Text style={styles.subtitle}>Tambah Pelanggan Baru</Text>

          <TextInput
            style={styles.input}
            placeholder="Nama"
            placeholderTextColor="#9ca3af"
            value={nama}
            onChangeText={setNama}
          />
          <TextInput
            style={styles.input}
            placeholder="Alamat"
            placeholderTextColor="#9ca3af"
            value={alamat}
            onChangeText={setAlamat}
          />
          <TextInput
            style={styles.input}
            placeholder="No. HP"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            value={noHp}
            onChangeText={setNoHp}
          />

          <View style={styles.odpRow}>
            {odpList.length === 0 ? (
              <Text style={styles.error}>
                Belum ada ODP di Wilayah Anda — buat ODP dulu di Kelola ODP.
              </Text>
            ) : (
              odpList.map((odp) => (
                <TouchableOpacity
                  key={odp.id}
                  style={[
                    styles.odpOption,
                    odpId === odp.id && styles.odpOptionSelected,
                  ]}
                  onPress={() => setOdpId(odp.id)}
                >
                  <Text
                    style={
                      odpId === odp.id
                        ? styles.odpOptionTextSelected
                        : styles.odpOptionText
                    }
                  >
                    {odp.label}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.odpRow}>
            {paketList.length === 0 ? (
              <Text style={styles.error}>
                Belum ada Paket — minta Pemilik menambah Paket dulu.
              </Text>
            ) : (
              paketList.map((paket) => (
                <TouchableOpacity
                  key={paket.id}
                  style={[
                    styles.odpOption,
                    paketId === paket.id && styles.odpOptionSelected,
                  ]}
                  onPress={() => setPaketId(paket.id)}
                >
                  <Text
                    style={
                      paketId === paket.id
                        ? styles.odpOptionTextSelected
                        : styles.odpOptionText
                    }
                  >
                    {paket.nama}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.button,
              (!nama.trim() || !alamat.trim() || !noHp.trim() || !odpId || !paketId) &&
                styles.buttonDisabled,
            ]}
            onPress={() => setIsConfirmVisible(true)}
            disabled={
              !nama.trim() || !alamat.trim() || !noHp.trim() || !odpId || !paketId
            }
          >
            <Text style={styles.buttonText}>Tambah Pelanggan</Text>
          </TouchableOpacity>

          <ConfirmModal
            visible={isConfirmVisible}
            title="Konfirmasi Pelanggan Baru"
            fields={[
              { label: "Nama", value: nama },
              { label: "Alamat", value: alamat },
              { label: "No. HP", value: noHp },
              { label: "ODP", value: selectedOdpLabel },
              { label: "Paket", value: selectedPaketNama },
            ]}
            isSubmitting={isSubmitting}
            onCancel={() => setIsConfirmVisible(false)}
            onConfirm={handleConfirm}
          />
        </>
      ) : null}
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
  loading: {
    marginVertical: 12,
  },
  emptyText: {
    color: "#6b7280",
    paddingVertical: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 24,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
  },
  list: {
    marginBottom: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 12,
    marginBottom: 10,
  },
  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarSmallText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  cardBody: {
    flex: 1,
    flexShrink: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  cardDetail: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: "#c7cdd6",
    marginLeft: 4,
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
  odpRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  odpOption: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  odpOptionSelected: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  odpOptionText: {
    color: "#374151",
    fontSize: 13,
  },
  odpOptionTextSelected: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  error: {
    color: "#c0392b",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
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
  detailHeader: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 26,
  },
  infoCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  infoRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f2",
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 24,
    backgroundColor: "#c0392b",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
