import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
import { updatePelanggan } from "../pelanggan/updatePelanggan";
import { updatePelangganHarga } from "../pelanggan/updatePelangganHarga";
import { updateSudahBayarBulanIni } from "../pelanggan/updateSudahBayarBulanIni";
import { updateMikrotikUsername } from "../pelanggan/updateMikrotikUsername";
import { setPelangganIsolir } from "../pelanggan/setPelangganIsolir";
import { endPelangganConnection } from "../pelanggan/endPelangganConnection";
import {
  canCreatePelanggan,
  canDeletePelanggan,
  canEditPelanggan,
  canEditPelangganHarga,
  canMarkSudahBayarBulanIni,
  canManageIsolir,
} from "../auth/permissions";
import type { UserProfile } from "../auth/profile";
import { ConfirmModal } from "../components/ConfirmModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { BackButton } from "../components/BackButton";
import { Dropdown } from "../components/Dropdown";

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

function formatHarga(harga: number | null): string {
  if (harga == null) return "Belum diisi";
  return `Rp${harga.toLocaleString("id-ID")}`;
}

type BadgeTone = "success" | "danger" | "neutral";

function Badge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <View style={[styles.badge, styles[`badge_${tone}` as const]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${tone}` as const]]}>{label}</Text>
    </View>
  );
}

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
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const [selectedDetail, setSelectedDetail] = useState<PelangganDetail | null>(
    null
  );

  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editNama, setEditNama] = useState("");
  const [editAlamat, setEditAlamat] = useState("");
  const [editNoHp, setEditNoHp] = useState("");
  const [editOdpId, setEditOdpId] = useState<string | null>(null);
  const [editPaketId, setEditPaketId] = useState<string | null>(null);
  const [editPelangganError, setEditPelangganError] = useState<string | null>(null);
  const [isSavingEditPelanggan, setIsSavingEditPelanggan] = useState(false);
  const [isEditingPelanggan, setIsEditingPelanggan] = useState(false);

  const [hargaInput, setHargaInput] = useState("");
  const [hargaError, setHargaError] = useState<string | null>(null);
  const [isSavingHarga, setIsSavingHarga] = useState(false);

  const [isSavingSudahBayar, setIsSavingSudahBayar] = useState(false);
  const [sudahBayarError, setSudahBayarError] = useState<string | null>(null);

  const [mikrotikUsernameInput, setMikrotikUsernameInput] = useState("");
  const [mikrotikError, setMikrotikError] = useState<string | null>(null);
  const [isSavingMikrotikUsername, setIsSavingMikrotikUsername] = useState(false);
  const [isMikrotikUsernameSaved, setIsMikrotikUsernameSaved] = useState(false);

  const [isolirError, setIsolirError] = useState<string | null>(null);
  const [isTogglingIsolir, setIsTogglingIsolir] = useState(false);

  const [endConnectionError, setEndConnectionError] = useState<string | null>(null);
  const [endConnectionMessage, setEndConnectionMessage] = useState<string | null>(null);
  const [isEndingConnection, setIsEndingConnection] = useState(false);

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

  function openAddModal() {
    setError(null);
    setNama("");
    setAlamat("");
    setNoHp("");
    setIsAddModalVisible(true);
  }

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
    setIsAddModalVisible(false);
    setNama("");
    setAlamat("");
    setNoHp("");
    await reload();
  }

  const selectedOdpLabel = odpList.find((o) => o.id === odpId)?.label ?? "-";
  const selectedPaketNama = paketList.find((p) => p.id === paketId)?.nama ?? "-";
  const canSubmitPelanggan = Boolean(
    nama.trim() && alamat.trim() && noHp.trim() && odpId && paketId
  );

  async function handleSelect(item: PelangganListItem) {
    const detail = await getPelangganDetail(supabase, item.id);
    setSelectedDetail(detail);
    setEditNama(detail?.nama ?? "");
    setEditAlamat(detail?.alamat ?? "");
    setEditNoHp(detail?.noHp ?? "");
    setEditOdpId(detail?.odpId ?? null);
    setEditPaketId(detail?.paketId ?? null);
    setEditPelangganError(null);
    setIsEditingPelanggan(false);
    setHargaInput(detail?.harga != null ? String(detail.harga) : "");
    setHargaError(null);
    setMikrotikUsernameInput(detail?.mikrotikUsername ?? "");
    setMikrotikError(null);
    setIsMikrotikUsernameSaved(false);
    setSudahBayarError(null);
    setIsolirError(null);
    setEndConnectionError(null);
    setEndConnectionMessage(null);
  }

  function handleStartEditPelanggan() {
    if (!selectedDetail) return;
    setEditNama(selectedDetail.nama);
    setEditAlamat(selectedDetail.alamat);
    setEditNoHp(selectedDetail.noHp);
    setEditOdpId(selectedDetail.odpId);
    setEditPaketId(selectedDetail.paketId);
    setEditPelangganError(null);
    setIsEditingPelanggan(true);
  }

  function handleCancelEditPelanggan() {
    setEditPelangganError(null);
    setIsEditingPelanggan(false);
  }

  async function handleSaveEditPelanggan() {
    if (!selectedDetail) return;

    if (!editNama.trim() || !editAlamat.trim() || !editNoHp.trim()) {
      setEditPelangganError("Nama, Alamat, dan No. HP tidak boleh kosong.");
      return;
    }
    if (!editOdpId) {
      setEditPelangganError("Pilih ODP terlebih dahulu.");
      return;
    }
    if (!editPaketId) {
      setEditPelangganError("Pilih Paket terlebih dahulu.");
      return;
    }

    const odp = odpList.find((o) => o.id === editOdpId);
    if (!odp) {
      setEditPelangganError("ODP yang dipilih tidak valid.");
      return;
    }

    setEditPelangganError(null);
    setIsSavingEditPelanggan(true);
    const result = await updatePelanggan(supabase, selectedDetail.id, {
      nama: editNama.trim(),
      alamat: editAlamat.trim(),
      noHp: editNoHp.trim(),
      odpId: editOdpId,
      wilayahId: odp.wilayahId,
      paketId: editPaketId,
    });
    setIsSavingEditPelanggan(false);

    if (!result.success) {
      setEditPelangganError(result.error);
      return;
    }

    setSelectedDetail({
      ...selectedDetail,
      nama: editNama.trim(),
      alamat: editAlamat.trim(),
      noHp: editNoHp.trim(),
      odpId: editOdpId,
      odpLabel: odp.label,
      wilayahId: odp.wilayahId,
      wilayahNama: odp.wilayahNama,
      paketId: editPaketId,
      paketNama: paketList.find((p) => p.id === editPaketId)?.nama ?? selectedDetail.paketNama,
    });
    setIsEditingPelanggan(false);
  }

  function handleChangeMikrotikUsername(value: string) {
    setMikrotikUsernameInput(value);
    setIsMikrotikUsernameSaved(false);
  }

  async function handleToggleSudahBayar() {
    if (!selectedDetail) return;
    const next = !selectedDetail.sudahBayarBulanIni;
    setSudahBayarError(null);
    setIsSavingSudahBayar(true);
    const result = await updateSudahBayarBulanIni(supabase, selectedDetail.id, next);
    setIsSavingSudahBayar(false);

    if (!result.success) {
      setSudahBayarError(result.error);
      return;
    }

    setSelectedDetail({
      ...selectedDetail,
      sudahBayarBulanIni: next,
      isIsolir: result.isolirCleared ? false : selectedDetail.isIsolir,
    });
  }

  async function handleSaveMikrotikUsername() {
    if (!selectedDetail) return;
    if (!mikrotikUsernameInput.trim()) {
      setMikrotikError("Username Mikrotik tidak boleh kosong.");
      return;
    }

    setMikrotikError(null);
    setIsSavingMikrotikUsername(true);
    const result = await updateMikrotikUsername(
      supabase,
      selectedDetail.id,
      mikrotikUsernameInput.trim()
    );
    setIsSavingMikrotikUsername(false);

    if (!result.success) {
      setMikrotikError(result.error);
      return;
    }

    setSelectedDetail({ ...selectedDetail, mikrotikUsername: mikrotikUsernameInput.trim() });
    setIsMikrotikUsernameSaved(true);
  }

  async function handleToggleIsolir() {
    if (!selectedDetail) return;
    const next = !selectedDetail.isIsolir;

    setIsolirError(null);
    setIsTogglingIsolir(true);
    const result = await setPelangganIsolir(supabase, selectedDetail.id, next);
    setIsTogglingIsolir(false);

    if (!result.success) {
      setIsolirError(result.error);
      return;
    }

    setSelectedDetail({ ...selectedDetail, isIsolir: next });
  }

  async function handleEndConnection() {
    if (!selectedDetail) return;

    setEndConnectionError(null);
    setEndConnectionMessage(null);
    setIsEndingConnection(true);
    const result = await endPelangganConnection(supabase, selectedDetail.id);
    setIsEndingConnection(false);

    if (!result.success) {
      setEndConnectionError(result.error);
      return;
    }

    setEndConnectionMessage(
      result.endedCount > 0
        ? `Koneksi diputus (${result.endedCount} sesi aktif).`
        : "Pelanggan ini sedang tidak online — tidak ada yang perlu diputus."
    );
  }

  async function handleSaveHarga() {
    if (!selectedDetail) return;

    const parsed = Number(hargaInput);
    if (!hargaInput.trim() || !Number.isFinite(parsed) || parsed < 0) {
      setHargaError("Harga harus berupa angka, 0 atau lebih.");
      return;
    }

    setHargaError(null);
    setIsSavingHarga(true);
    const result = await updatePelangganHarga(supabase, selectedDetail.id, parsed);
    setIsSavingHarga(false);

    if (!result.success) {
      setHargaError(result.error);
      return;
    }

    setSelectedDetail({ ...selectedDetail, harga: parsed });
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
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <BackButton onPress={() => setSelectedDetail(null)} label="Kembali ke daftar" />

        <View style={styles.detailHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {selectedDetail.nama.charAt(0).toUpperCase()}
            </Text>
          </View>
          {isEditingPelanggan ? (
            <TextInput
              style={[styles.input, styles.nameInput]}
              placeholder="Nama Pelanggan"
              placeholderTextColor="#9ca3af"
              value={editNama}
              onChangeText={setEditNama}
            />
          ) : (
            <Text style={styles.title}>{selectedDetail.nama}</Text>
          )}

          {canEditPelanggan(profile.role) ? (
            isEditingPelanggan ? (
              <View style={styles.editToggleRow}>
                <TouchableOpacity onPress={handleCancelEditPelanggan} disabled={isSavingEditPelanggan}>
                  <Text style={styles.editToggleCancel}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEditPelanggan} disabled={isSavingEditPelanggan}>
                  <Text style={styles.editToggleSave}>
                    {isSavingEditPelanggan ? "Menyimpan..." : "Simpan"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.editToggleButton} onPress={handleStartEditPelanggan}>
                <Text style={styles.editToggleButtonText}>✎ Edit Data Pelanggan</Text>
              </TouchableOpacity>
            )
          ) : null}

          {editPelangganError ? (
            <Text style={[styles.error, styles.editToggleErrorSpacing]}>
              {editPelangganError}
            </Text>
          ) : null}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nomor Pelanggan</Text>
            <Text style={styles.infoValue}>{selectedDetail.nomorPelanggan}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alamat</Text>
            {isEditingPelanggan ? (
              <TextInput
                style={styles.inlineInput}
                placeholder="Alamat"
                placeholderTextColor="#9ca3af"
                value={editAlamat}
                onChangeText={setEditAlamat}
              />
            ) : (
              <Text style={styles.infoValue}>{selectedDetail.alamat}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>No. HP</Text>
            {isEditingPelanggan ? (
              <TextInput
                style={styles.inlineInput}
                placeholder="08xxxxxxxxxx"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={editNoHp}
                onChangeText={setEditNoHp}
              />
            ) : (
              <Text style={styles.infoValue}>{selectedDetail.noHp}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Wilayah</Text>
            <Text style={styles.infoValue}>{selectedDetail.wilayahNama ?? "-"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ODP asal</Text>
            {isEditingPelanggan ? (
              <Dropdown
                title="Pilih ODP"
                searchable
                valueLabel={
                  odpList.find((o) => o.id === editOdpId)?.label ?? selectedDetail.odpLabel ?? ""
                }
                options={odpList.map((o) => ({
                  id: o.id,
                  label: o.wilayahNama ? `${o.label} (${o.wilayahNama})` : o.label,
                }))}
                onSelect={setEditOdpId}
              />
            ) : (
              <Text style={styles.infoValue}>{selectedDetail.odpLabel ?? "-"}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Paket</Text>
            {isEditingPelanggan ? (
              <Dropdown
                title="Pilih Paket"
                valueLabel={
                  paketList.find((p) => p.id === editPaketId)?.nama ??
                  selectedDetail.paketNama ??
                  ""
                }
                options={paketList.map((p) => ({ id: p.id, label: p.nama }))}
                onSelect={setEditPaketId}
              />
            ) : (
              <Text style={styles.infoValue}>{selectedDetail.paketNama ?? "-"}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Harga Langganan</Text>
            <Text style={styles.infoValue}>{formatHarga(selectedDetail.harga)}</Text>
          </View>

          <TouchableOpacity
            style={styles.infoRow}
            activeOpacity={canMarkSudahBayarBulanIni(profile.role) ? 0.6 : 1}
            onPress={canMarkSudahBayarBulanIni(profile.role) ? handleToggleSudahBayar : undefined}
            disabled={!canMarkSudahBayarBulanIni(profile.role) || isSavingSudahBayar}
          >
            <Text style={styles.infoLabel}>Status Bayar Bulan Ini</Text>
            <View style={styles.statusBayarRow}>
              <Badge
                label={selectedDetail.sudahBayarBulanIni ? "Sudah Bayar" : "Belum Bayar"}
                tone={selectedDetail.sudahBayarBulanIni ? "success" : "danger"}
              />
              {canMarkSudahBayarBulanIni(profile.role) ? (
                <View
                  style={[
                    styles.checkbox,
                    selectedDetail.sudahBayarBulanIni && styles.checkboxChecked,
                  ]}
                >
                  {selectedDetail.sudahBayarBulanIni ? (
                    <Text style={styles.checkboxMark}>✓</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </TouchableOpacity>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Status Koneksi</Text>
            <Badge
              label={selectedDetail.isIsolir ? "Terisolir" : "Aktif (tidak diisolir)"}
              tone={selectedDetail.isIsolir ? "danger" : "success"}
            />
          </View>
        </View>

        {sudahBayarError ? (
          <Text style={[styles.error, styles.sudahBayarErrorSpacing]}>{sudahBayarError}</Text>
        ) : null}

        {canEditPelangganHarga(profile.role) ? (
          <View style={styles.sectionCard}>
            <Text style={styles.subtitle}>Edit Harga Langganan</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 165000"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={hargaInput}
              onChangeText={setHargaInput}
            />
            {hargaError ? <Text style={styles.error}>{hargaError}</Text> : null}
            <TouchableOpacity
              style={[styles.button, isSavingHarga && styles.buttonDisabled]}
              onPress={handleSaveHarga}
              disabled={isSavingHarga}
            >
              <Text style={styles.buttonText}>
                {isSavingHarga ? "Menyimpan..." : "Simpan Harga"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {canManageIsolir(profile.role) ? (
          <View style={styles.sectionCard}>
            <Text style={styles.subtitle}>Mikrotik & Isolir</Text>
            <Text style={styles.sectionHint}>Khusus Pemilik</Text>
            <TextInput
              style={styles.input}
              placeholder="Username Mikrotik (PPPoE)"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              value={mikrotikUsernameInput}
              onChangeText={handleChangeMikrotikUsername}
            />
            {mikrotikError ? <Text style={styles.error}>{mikrotikError}</Text> : null}
            {isMikrotikUsernameSaved ? (
              <Text style={styles.success}>Username Mikrotik tersimpan.</Text>
            ) : null}
            <TouchableOpacity
              style={[
                styles.button,
                (isSavingMikrotikUsername || isMikrotikUsernameSaved) && styles.buttonDisabled,
              ]}
              onPress={handleSaveMikrotikUsername}
              disabled={isSavingMikrotikUsername || isMikrotikUsernameSaved}
            >
              <Text style={styles.buttonText}>
                {isSavingMikrotikUsername
                  ? "Menyimpan..."
                  : isMikrotikUsernameSaved
                  ? "Tersimpan"
                  : "Simpan Username Mikrotik"}
              </Text>
            </TouchableOpacity>

            <View style={styles.sectionDivider} />

            {isolirError ? <Text style={styles.error}>{isolirError}</Text> : null}
            <TouchableOpacity
              style={[
                styles.warningButton,
                selectedDetail.isIsolir && styles.successButton,
                isTogglingIsolir && styles.buttonDisabled,
              ]}
              onPress={handleToggleIsolir}
              disabled={isTogglingIsolir}
            >
              <Text style={styles.buttonText}>
                {isTogglingIsolir
                  ? "Memproses..."
                  : selectedDetail.isIsolir
                  ? "Cabut Isolir"
                  : "Isolir Sekarang"}
              </Text>
            </TouchableOpacity>

            {endConnectionError ? (
              <Text style={styles.error}>{endConnectionError}</Text>
            ) : null}
            {endConnectionMessage ? (
              <Text style={styles.success}>{endConnectionMessage}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.neutralButton, isEndingConnection && styles.buttonDisabled]}
              onPress={handleEndConnection}
              disabled={isEndingConnection}
            >
              <Text style={styles.buttonText}>
                {isEndingConnection ? "Memproses..." : "Putus Koneksi"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
    <View style={styles.listContainer}>
      <View style={styles.headerRow}>
        <BackButton onPress={onBack} />
        {canCreatePelanggan(profile.role) ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddModal}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.addButtonText}>+ Tambah Pelanggan</Text>
          </TouchableOpacity>
        ) : null}
      </View>

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
      ) : (
        <FlatList
          style={styles.list}
          data={results}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada Pelanggan.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
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
          )}
        />
      )}

      {canCreatePelanggan(profile.role) ? (
        <>
          <Modal
            visible={isAddModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setIsAddModalVisible(false)}
          >
            <View style={styles.formBackdrop}>
              <View style={styles.formCard}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.title}>Tambah Pelanggan Baru</Text>

                  <Text style={styles.fieldLabel}>Nama</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nama Pelanggan"
                    placeholderTextColor="#9ca3af"
                    value={nama}
                    onChangeText={setNama}
                  />

                  <Text style={styles.fieldLabel}>Alamat</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Alamat lengkap"
                    placeholderTextColor="#9ca3af"
                    value={alamat}
                    onChangeText={setAlamat}
                  />

                  <Text style={styles.fieldLabel}>No. HP</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="08xxxxxxxxxx"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    value={noHp}
                    onChangeText={setNoHp}
                  />

                  <Text style={styles.fieldLabel}>ODP</Text>
                  {odpList.length === 0 ? (
                    <Text style={styles.error}>
                      Belum ada ODP di Wilayah Anda — buat ODP dulu di Kelola ODP.
                    </Text>
                  ) : (
                    <Dropdown
                      variant="field"
                      title="Pilih ODP"
                      searchable
                      valueLabel={selectedOdpLabel}
                      options={odpList.map((odp) => ({
                        id: odp.id,
                        label: odp.wilayahNama ? `${odp.label} (${odp.wilayahNama})` : odp.label,
                      }))}
                      onSelect={setOdpId}
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
                      valueLabel={selectedPaketNama}
                      options={paketList.map((paket) => ({ id: paket.id, label: paket.nama }))}
                      onSelect={setPaketId}
                    />
                  )}

                  {error ? <Text style={[styles.error, styles.formErrorSpacing]}>{error}</Text> : null}

                  <View style={styles.formButtonRow}>
                    <TouchableOpacity
                      style={[styles.formButton, styles.cancelButton]}
                      onPress={() => setIsAddModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.formButton,
                        styles.formSubmitButton,
                        !canSubmitPelanggan && styles.buttonDisabled,
                      ]}
                      onPress={() => setIsConfirmVisible(true)}
                      disabled={!canSubmitPelanggan}
                    >
                      <Text style={styles.buttonText}>Lanjutkan</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  listContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  addButton: {
    backgroundColor: "#1B7396",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
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
    flex: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 12,
    marginBottom: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1B7396",
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
  error: {
    color: "#DC2626",
    marginBottom: 10,
  },
  formErrorSpacing: {
    marginTop: -2,
  },
  sudahBayarErrorSpacing: {
    marginTop: 12,
  },
  formBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  formCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "88%",
  },
  formButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  formButton: {
    flex: 1,
    backgroundColor: "#1B7396",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#1B7396",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  formSubmitButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#f1f1f1",
    shadowOpacity: 0,
    elevation: 0,
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  success: {
    color: "#15803d",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#1B7396",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
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
  detailHeader: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  nameInput: {
    width: "100%",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 0,
  },
  editToggleButton: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
  },
  editToggleButtonText: {
    color: "#1B7396",
    fontSize: 13,
    fontWeight: "700",
  },
  editToggleRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 12,
  },
  editToggleCancel: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },
  editToggleSave: {
    color: "#1B7396",
    fontSize: 13,
    fontWeight: "700",
  },
  editToggleErrorSpacing: {
    marginTop: 10,
    marginBottom: 0,
    textAlign: "center",
  },
  inlineInput: {
    flex: 1,
    marginLeft: 16,
    textAlign: "right",
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
    paddingVertical: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1B7396",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 16,
    marginTop: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionHint: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: -6,
    marginBottom: 14,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#E4E7EB",
    marginVertical: 16,
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
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  warningButton: {
    backgroundColor: "#D97706",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#D97706",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  successButton: {
    backgroundColor: "#059669",
    shadowColor: "#059669",
  },
  neutralButton: {
    backgroundColor: "#475569",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#475569",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statusBayarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  checkboxMark: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  badge_success: {
    backgroundColor: "#DCFCE7",
  },
  badge_danger: {
    backgroundColor: "#FEE2E2",
  },
  badge_neutral: {
    backgroundColor: "#F1F5F9",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeText_success: {
    color: "#15803D",
  },
  badgeText_danger: {
    color: "#DC2626",
  },
  badgeText_neutral: {
    color: "#475569",
  },
});
