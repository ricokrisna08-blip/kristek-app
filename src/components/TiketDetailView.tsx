import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { supabase } from "../lib/supabase";
import { type TiketDetail } from "../tiket/getTiketDetail";
import { startTiket } from "../tiket/startTiket";
import { setTiketPending } from "../tiket/setTiketPending";
import { resumeTiketFromPending } from "../tiket/resumeTiketFromPending";
import { endTiket } from "../tiket/endTiket";
import { endTiketWithEvidence } from "../tiket/endTiketWithEvidence";
import { uploadTiketEvidenceFoto } from "../tiket/uploadTiketEvidenceFoto";
import { captureTiketEvidenceLokasi } from "../tiket/captureTiketEvidenceLokasi";
import {
  requiresEvidenceChecklist,
  computeEvidenceStatus,
  isEvidenceComplete,
  isEvidenceFotoDone,
  EVIDENCE_FOTO_TYPES,
  type EvidenceFotoType,
} from "../tiket/instalasiEvidence";
import { reassignTiketTeknisi } from "../tiket/reassignTiketTeknisi";
import { listAccounts, type AccountListItem } from "../accounts/listAccounts";
import { batalkanTiket } from "../tiket/batalkanTiket";
import { deleteTiket } from "../tiket/deleteTiket";
import { computeDurasiKerjaSeconds, formatDurasiKerja } from "../tiket/durasiKerja";
import { listTiketFoto, type TiketFoto } from "../tiket/listTiketFoto";
import { deleteTiketFoto } from "../tiket/deleteTiketFoto";
import { applyTiketEvent, type TiketStatus } from "../tiket/stateMachine/applyTiketEvent";
import {
  listTiketStatusLog,
  type TiketStatusLogEntry,
} from "../tiket/listTiketStatusLog";
import { JENIS_LABEL, STATUS_LABEL } from "../tiket/labels";
import { TiketStatusBar } from "./TiketStatusBar";
import { ScreenHeader } from "./ScreenHeader";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import type { UserProfile } from "../auth/profile";
import { canResetTiketData } from "../auth/permissions";
import { isOnline } from "../offline/isOnline";
import { persistCapturedPhoto } from "../offline/persistCapturedPhoto";
import { offlineQueueStore } from "../offline/offlineQueueStore.instance";
import { useOfflineQueue } from "../offline/useOfflineQueue";
import { fetchPhotoBlob } from "../offline/fetchPhotoBlob";

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// tanggal_instalasi adalah kolom `date` murni ("YYYY-MM-DD"), beda dari
// formatTanggal di atas yang buat timestamp lengkap -- perlu "T00:00:00"
// supaya di-parse sebagai waktu lokal, bukan tengah malam UTC yang bisa
// geser mundur satu hari.
function formatTanggalOnly(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatHarga(harga: number): string {
  return `Rp${harga.toLocaleString("id-ID")}`;
}

const FOTO_TYPE_LABEL: Record<string, string> = {
  before: "Before",
  after: "After",
  redaman: "Redaman",
  ont: "ONT",
  kabel_jalur: "Kabel & Jalur",
};

const EVIDENCE_FOTO_LABEL: Record<EvidenceFotoType, string> = {
  redaman: "Foto Redaman",
  ont: "Foto ONT",
  kabel_jalur: "Foto Kabel & Jalur",
};

function formatTanggalJam(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Best-effort: kalau izin lokasi ditolak atau GPS gagal ambil titik, foto
// bukti tetap boleh terus (jangan blokir alur Start/End Tiket cuma gara-gara
// lokasi) -- geotag ini pelengkap, bukan syarat wajib.
async function captureCurrentLocation(): Promise<{
  latitude: number | null;
  longitude: number | null;
}> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return { latitude: null, longitude: null };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return { latitude: null, longitude: null };
  }
}

type Props = {
  detail: TiketDetail;
  profile: UserProfile;
  onBack: () => void;
  onChanged: () => void;
  onDeleted: () => void;
};

export function TiketDetailView({ detail, profile, onBack, onChanged, onDeleted }: Props) {
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [statusLog, setStatusLog] = useState<TiketStatusLogEntry[]>([]);

  const [isSettingPending, setIsSettingPending] = useState(false);
  const [pendingNotes, setPendingNotes] = useState("");
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [isSubmittingPending, setIsSubmittingPending] = useState(false);

  const [isResuming, setIsResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const [isEnding, setIsEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  const [uploadingEvidenceType, setUploadingEvidenceType] = useState<EvidenceFotoType | null>(
    null
  );
  const [isCapturingLokasi, setIsCapturingLokasi] = useState(false);
  const [isFinishingWithEvidence, setIsFinishingWithEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const [isEditingTeknisi, setIsEditingTeknisi] = useState(false);
  const [teknisiOptions, setTeknisiOptions] = useState<AccountListItem[]>([]);
  const [selectedTeknisiIds, setSelectedTeknisiIds] = useState<string[]>([]);
  const [isSavingTeknisi, setIsSavingTeknisi] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);

  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isDeleteTiketConfirmVisible, setIsDeleteTiketConfirmVisible] = useState(false);
  const [isDeletingTiket, setIsDeletingTiket] = useState(false);
  const [deleteTiketError, setDeleteTiketError] = useState<string | null>(null);

  const [fotoList, setFotoList] = useState<TiketFoto[]>([]);
  const [viewingFoto, setViewingFoto] = useState<TiketFoto | null>(null);
  const [deleteFotoTarget, setDeleteFotoTarget] = useState<TiketFoto | null>(null);
  const [deleteFotoError, setDeleteFotoError] = useState<string | null>(null);
  const [isDeletingFoto, setIsDeletingFoto] = useState(false);

  const [optimisticStatus, setOptimisticStatus] = useState<TiketStatus | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const offlineQueueState = useOfflineQueue();

  const effectiveStatus: TiketStatus = optimisticStatus ?? (detail.status as TiketStatus);
  const queuedActionsForTiket = offlineQueueState.queue.filter(
    (action) => action.tiketId === detail.id
  );
  const failuresForTiket = offlineQueueState.failures.filter(
    (failure) => failure.action.tiketId === detail.id
  );

  const evidenceStatus = computeEvidenceStatus({
    fotoTypes: fotoList.map((foto) => foto.type),
    hasLokasi: detail.evidenceLokasi != null,
  });

  useEffect(() => {
    setOptimisticStatus(null);
  }, [detail.status]);

  useEffect(() => {
    listTiketStatusLog(supabase, detail.id).then(setStatusLog);
    listTiketFoto(supabase, detail.id).then(setFotoList);
  }, [detail.id, detail.status]);

  async function handleStart() {
    setStartError(null);
    setOfflineNotice(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setStartError('Izin kamera dibutuhkan untuk mengambil foto "before".');
      return;
    }

    const captured = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (captured.canceled || !captured.assets?.[0]) {
      return;
    }

    setIsStarting(true);

    const { latitude, longitude } = await captureCurrentLocation();

    if (!(await isOnline())) {
      const photoUri = await persistCapturedPhoto(
        captured.assets[0].uri,
        `before-${detail.id}-${Date.now()}.jpg`
      );
      await offlineQueueStore.enqueue({
        type: "start",
        tiketId: detail.id,
        uploadedBy: profile.id,
        photoUri,
        latitude,
        longitude,
      });
      const machineResult = applyTiketEvent(
        { status: effectiveStatus },
        { type: "start", hasBeforePhoto: true }
      );
      if (machineResult.valid) setOptimisticStatus(machineResult.newStatus);
      setOfflineNotice(
        'Kamu sedang offline. Aksi Start ini disimpan dan akan otomatis dikirim begitu online lagi.'
      );
      setIsStarting(false);
      return;
    }

    const photoBlob = await fetchPhotoBlob(captured.assets[0].uri);

    const result = await startTiket(supabase, {
      tiketId: detail.id,
      uploadedBy: profile.id,
      photoBlob,
      latitude,
      longitude,
    });
    setIsStarting(false);

    if (!result.success) {
      setStartError(result.error);
      return;
    }

    onChanged();
  }

  async function handleSubmitPending() {
    setPendingError(null);
    setOfflineNotice(null);
    setIsSubmittingPending(true);

    if (!(await isOnline())) {
      await offlineQueueStore.enqueue({
        type: "pending",
        tiketId: detail.id,
        changedBy: profile.id,
        notes: pendingNotes,
      });
      const machineResult = applyTiketEvent(
        { status: effectiveStatus },
        { type: "pending", notes: pendingNotes }
      );
      if (machineResult.valid) setOptimisticStatus(machineResult.newStatus);
      setOfflineNotice(
        "Kamu sedang offline. Aksi Pending ini disimpan dan akan otomatis dikirim begitu online lagi."
      );
      setIsSubmittingPending(false);
      setIsSettingPending(false);
      setPendingNotes("");
      return;
    }

    const result = await setTiketPending(supabase, {
      tiketId: detail.id,
      changedBy: profile.id,
      notes: pendingNotes,
    });
    setIsSubmittingPending(false);

    if (!result.success) {
      setPendingError(result.error);
      return;
    }

    setIsSettingPending(false);
    setPendingNotes("");
    onChanged();
  }

  async function handleLanjut() {
    setResumeError(null);
    setOfflineNotice(null);
    setIsResuming(true);

    if (!(await isOnline())) {
      await offlineQueueStore.enqueue({
        type: "lanjut",
        tiketId: detail.id,
        changedBy: profile.id,
      });
      const machineResult = applyTiketEvent({ status: effectiveStatus }, { type: "lanjut" });
      if (machineResult.valid) setOptimisticStatus(machineResult.newStatus);
      setOfflineNotice(
        "Kamu sedang offline. Aksi Lanjut ini disimpan dan akan otomatis dikirim begitu online lagi."
      );
      setIsResuming(false);
      return;
    }

    const result = await resumeTiketFromPending(supabase, {
      tiketId: detail.id,
      changedBy: profile.id,
    });
    setIsResuming(false);

    if (!result.success) {
      setResumeError(result.error);
      return;
    }

    onChanged();
  }

  async function handleEnd() {
    setEndError(null);
    setOfflineNotice(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setEndError('Izin kamera dibutuhkan untuk mengambil foto "after".');
      return;
    }

    const captured = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (captured.canceled || !captured.assets?.[0]) {
      return;
    }

    setIsEnding(true);

    const { latitude, longitude } = await captureCurrentLocation();

    if (!(await isOnline())) {
      const photoUri = await persistCapturedPhoto(
        captured.assets[0].uri,
        `after-${detail.id}-${Date.now()}.jpg`
      );
      await offlineQueueStore.enqueue({
        type: "end",
        tiketId: detail.id,
        uploadedBy: profile.id,
        photoUri,
        latitude,
        longitude,
      });
      const machineResult = applyTiketEvent(
        { status: effectiveStatus },
        { type: "end", hasAfterPhoto: true }
      );
      if (machineResult.valid) setOptimisticStatus(machineResult.newStatus);
      setOfflineNotice(
        'Kamu sedang offline. Aksi End ini disimpan dan akan otomatis dikirim begitu online lagi.'
      );
      setIsEnding(false);
      return;
    }

    const photoBlob = await fetchPhotoBlob(captured.assets[0].uri);

    const result = await endTiket(supabase, {
      tiketId: detail.id,
      uploadedBy: profile.id,
      photoBlob,
      latitude,
      longitude,
    });
    setIsEnding(false);

    if (!result.success) {
      setEndError(result.error);
      return;
    }

    onChanged();
  }

  // Foto checklist bukti diupload satu-satu, tanpa transisi status --
  // beda dari before/after, jadi useEffect [detail.id, detail.status]
  // di atas tidak otomatis refetch fotoList. Refresh manual di sini.
  async function refreshFotoList() {
    const result = await listTiketFoto(supabase, detail.id);
    setFotoList(result);
  }

  async function handleUploadEvidence(type: EvidenceFotoType) {
    setEvidenceError(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setEvidenceError("Izin kamera dibutuhkan untuk mengambil foto ini.");
      return;
    }

    const captured = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (captured.canceled || !captured.assets?.[0]) {
      return;
    }

    setUploadingEvidenceType(type);

    if (!(await isOnline())) {
      setUploadingEvidenceType(null);
      setEvidenceError("Perlu koneksi internet untuk upload bukti ini, coba lagi.");
      return;
    }

    const { latitude, longitude } = await captureCurrentLocation();
    const photoBlob = await fetchPhotoBlob(captured.assets[0].uri);

    const result = await uploadTiketEvidenceFoto(supabase, {
      tiketId: detail.id,
      uploadedBy: profile.id,
      type,
      photoBlob,
      latitude,
      longitude,
    });
    setUploadingEvidenceType(null);

    if (!result.success) {
      setEvidenceError(result.error);
      return;
    }

    await refreshFotoList();
  }

  async function handleCaptureLokasi() {
    setEvidenceError(null);
    setIsCapturingLokasi(true);

    if (!(await isOnline())) {
      setIsCapturingLokasi(false);
      setEvidenceError("Perlu koneksi internet untuk menyimpan lokasi ini, coba lagi.");
      return;
    }

    const { latitude, longitude } = await captureCurrentLocation();
    if (latitude == null || longitude == null) {
      setIsCapturingLokasi(false);
      setEvidenceError(
        "Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan lalu coba lagi."
      );
      return;
    }

    const result = await captureTiketEvidenceLokasi(supabase, {
      tiketId: detail.id,
      latitude,
      longitude,
    });
    setIsCapturingLokasi(false);

    if (!result.success) {
      setEvidenceError(result.error);
      return;
    }

    onChanged();
  }

  async function handleFinishWithEvidence() {
    setEvidenceError(null);
    setIsFinishingWithEvidence(true);

    const result = await endTiketWithEvidence(supabase, {
      tiketId: detail.id,
      changedBy: profile.id,
    });
    setIsFinishingWithEvidence(false);

    if (!result.success) {
      setEvidenceError(result.error);
      return;
    }

    onChanged();
  }

  async function handleOpenEditTeknisi() {
    setReassignError(null);
    setSelectedTeknisiIds(detail.teknisiList.map((teknisi) => teknisi.id));
    setIsEditingTeknisi(true);
    const accounts = await listAccounts(supabase);
    setTeknisiOptions(accounts.filter((account) => account.role === "teknisi"));
  }

  function toggleSelectedTeknisi(id: string) {
    setSelectedTeknisiIds((prev) =>
      prev.includes(id) ? prev.filter((teknisiId) => teknisiId !== id) : [...prev, id]
    );
  }

  function handleCancelEditTeknisi() {
    setIsEditingTeknisi(false);
    setReassignError(null);
  }

  async function handleSaveTeknisi() {
    setReassignError(null);
    setIsSavingTeknisi(true);
    const result = await reassignTiketTeknisi(supabase, {
      tiketId: detail.id,
      teknisiIds: selectedTeknisiIds,
    });
    setIsSavingTeknisi(false);

    if (!result.success) {
      setReassignError(result.error);
      return;
    }

    setIsEditingTeknisi(false);
    onChanged();
  }

  async function handleCancelTiket() {
    setCancelError(null);
    setIsCancelling(true);
    const result = await batalkanTiket(supabase, {
      tiketId: detail.id,
      cancelledBy: profile.id,
    });
    setIsCancelling(false);

    if (!result.success) {
      setCancelError(result.error);
      return;
    }

    setIsConfirmingCancel(false);
    onChanged();
  }

  async function handleDeleteTiket() {
    setDeleteTiketError(null);
    setIsDeletingTiket(true);
    const result = await deleteTiket(supabase, detail.id);
    setIsDeletingTiket(false);

    if (!result.success) {
      setDeleteTiketError(result.error);
      return;
    }

    setIsDeleteTiketConfirmVisible(false);
    onDeleted();
  }

  async function handleDeleteFoto() {
    if (!deleteFotoTarget) return;
    setDeleteFotoError(null);
    setIsDeletingFoto(true);
    const result = await deleteTiketFoto(supabase, deleteFotoTarget.id);
    setIsDeletingFoto(false);

    if (!result.success) {
      setDeleteFotoError(result.error);
      return;
    }

    setFotoList((prev) => prev.filter((foto) => foto.id !== deleteFotoTarget.id));
    setDeleteFotoTarget(null);
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={JENIS_LABEL[detail.jenis] ?? detail.jenis}
        subtitle={`Status: ${STATUS_LABEL[effectiveStatus] ?? effectiveStatus}`}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.container}>
      <TiketStatusBar status={effectiveStatus} />

      {offlineNotice ? <Text style={styles.offlineNotice}>{offlineNotice}</Text> : null}

      {queuedActionsForTiket.length > 0 ? (
        <Text style={styles.offlineNotice}>
          {queuedActionsForTiket.length} aksi menunggu sinkronisasi untuk Tiket ini.
        </Text>
      ) : null}

      {failuresForTiket.length > 0 ? (
        <View style={styles.syncFailureBox}>
          {failuresForTiket.map(({ action, error }) => (
            <Text key={action.id} style={styles.syncFailureText}>
              Gagal sinkron ({action.type}): {error}
            </Text>
          ))}
          <TouchableOpacity
            style={styles.retrySyncButton}
            onPress={() => offlineQueueStore.syncNow(supabase, fetchPhotoBlob)}
          >
            <Text style={styles.retrySyncButtonText}>Coba Sinkron Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <Text style={styles.detailLine}>
        Tanggal request: {formatTanggal(detail.createdAt)}
      </Text>

      {detail.pelanggan ? (
        <>
          <Text style={styles.subtitle}>Pelanggan</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama</Text>
              <Text style={styles.infoValue}>{detail.pelanggan.nama}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alamat</Text>
              <Text style={styles.infoValue}>{detail.pelanggan.alamat}</Text>
              <TouchableOpacity
                style={styles.mapsButton}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      detail.pelanggan!.alamat
                    )}`
                  )
                }
              >
                <Text style={styles.mapsButtonText}>📍 Buka Lokasi di Google Maps</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>No. HP</Text>
              <Text style={styles.infoValue}>{detail.pelanggan.noHp}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nomor Pelanggan</Text>
              <Text style={styles.infoValue}>{detail.pelanggan.nomorPelanggan}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ODP asal</Text>
              <Text style={styles.infoValue}>{detail.pelanggan.odpLabel ?? "-"}</Text>
            </View>
            <View
              style={
                detail.jenis === "instalasi" && detail.pelanggan.tanggalInstalasi
                  ? styles.infoRow
                  : [styles.infoRow, styles.infoRowLast]
              }
            >
              <Text style={styles.infoLabel}>Paket</Text>
              <Text style={styles.infoValue}>{detail.pelanggan.paketNama ?? "-"}</Text>
            </View>
            {detail.jenis === "instalasi" && detail.pelanggan.tanggalInstalasi ? (
              <View
                style={
                  detail.pelanggan.tagihanProrata != null
                    ? styles.infoRow
                    : [styles.infoRow, styles.infoRowLast]
                }
              >
                <Text style={styles.infoLabel}>Tanggal Instalasi</Text>
                <Text style={styles.infoValue}>
                  {formatTanggalOnly(detail.pelanggan.tanggalInstalasi)}
                </Text>
              </View>
            ) : null}
            {detail.jenis === "instalasi" && detail.pelanggan.tagihanProrata != null ? (
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>Tagihan Bulan Pertama (Prorata)</Text>
                <Text style={styles.infoValue}>
                  {formatHarga(detail.pelanggan.tagihanProrata)}
                </Text>
              </View>
            ) : null}
          </View>
        </>
      ) : null}

      <Text style={styles.subtitle}>Teknisi</Text>
      <View style={styles.infoCard}>
        {isEditingTeknisi ? (
          <View style={styles.teknisiEditBox}>
            {teknisiOptions.length === 0 ? (
              <Text style={styles.error}>Belum ada akun Teknisi.</Text>
            ) : (
              <View style={styles.teknisiEditList}>
                {teknisiOptions.map((teknisi) => {
                  const checked = selectedTeknisiIds.includes(teknisi.id);
                  return (
                    <TouchableOpacity
                      key={teknisi.id}
                      style={[styles.teknisiEditRow, checked && styles.teknisiEditRowSelected]}
                      onPress={() => toggleSelectedTeknisi(teknisi.id)}
                    >
                      <View style={[styles.checkbox, checked && styles.checkboxSelected]}>
                        {checked ? <Text style={styles.checkmark}>✓</Text> : null}
                      </View>
                      <View style={styles.teknisiEditInfo}>
                        <Text style={styles.teknisiEditName}>{teknisi.nama}</Text>
                        <Text style={styles.teknisiEditWilayah}>
                          {teknisi.wilayahNama ?? "Wilayah tidak diketahui"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {reassignError ? <Text style={styles.error}>{reassignError}</Text> : null}
            <View style={styles.pendingButtonRow}>
              <TouchableOpacity
                style={styles.pendingCancelButton}
                onPress={handleCancelEditTeknisi}
                disabled={isSavingTeknisi}
              >
                <Text style={styles.pendingCancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pendingButton, styles.pendingSubmitButton]}
                onPress={handleSaveTeknisi}
                disabled={isSavingTeknisi}
              >
                {isSavingTeknisi ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.pendingButtonText}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {(() => {
              const canReassign = profile.role === "admin" && effectiveStatus === "ditugaskan";
              const lastRowStyle = canReassign ? styles.infoRow : [styles.infoRow, styles.infoRowLast];
              return detail.teknisiList.length === 0 ? (
                <View style={lastRowStyle}>
                  <Text style={styles.infoValue}>Belum ada Teknisi ditugaskan</Text>
                </View>
              ) : (
                detail.teknisiList.map((teknisi, index) => (
                  <View
                    key={teknisi.id}
                    style={index === detail.teknisiList.length - 1 ? lastRowStyle : styles.infoRow}
                  >
                    <Text style={styles.infoValue}>{teknisi.nama}</Text>
                  </View>
                ))
              );
            })()}
            {profile.role === "admin" && effectiveStatus === "ditugaskan" ? (
              <TouchableOpacity
                style={styles.teknisiChangeButton}
                onPress={handleOpenEditTeknisi}
              >
                <Text style={styles.teknisiChangeButtonText}>Ganti Teknisi</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>

      {detail.keluhan ? (
        <>
          <Text style={styles.subtitle}>Keluhan</Text>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>{detail.keluhan}</Text>
          </View>
        </>
      ) : null}

      {detail.jenis === "maintenance" ? (
        <>
          <Text style={styles.subtitle}>ODP</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Label</Text>
              <Text style={styles.infoValue}>{detail.odp?.label ?? "-"}</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Lokasi</Text>
              <Text style={styles.infoValue}>{detail.odp?.lokasi ?? "-"}</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>Deskripsi Pekerjaan</Text>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>{detail.deskripsiPekerjaan ?? "-"}</Text>
          </View>
        </>
      ) : null}

      {fotoList.length > 0 ? (
        <>
          <Text style={styles.subtitle}>Foto</Text>
          <View style={styles.fotoRow}>
            {fotoList.map((foto) => (
              <View key={foto.id} style={styles.fotoItem}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setViewingFoto(foto)}>
                  <Image source={{ uri: foto.url }} style={styles.fotoImage} />
                </TouchableOpacity>
                <Text style={styles.fotoLabel}>{FOTO_TYPE_LABEL[foto.type] ?? foto.type}</Text>
                <Text style={styles.fotoTimestamp}>{formatTanggalJam(foto.uploadedAt)}</Text>
                {foto.latitude != null && foto.longitude != null ? (
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${foto.latitude},${foto.longitude}`
                      )
                    }
                  >
                    <Text style={styles.fotoAlamatLink}>📍 Lokasi foto ini</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.fotoAlamat}>📍 Lokasi tidak tercatat</Text>
                )}
                {profile.role === "pemilik" ? (
                  <TouchableOpacity
                    onPress={() => {
                      setDeleteFotoError(null);
                      setDeleteFotoTarget(foto);
                    }}
                  >
                    <Text style={styles.fotoDeleteText}>Hapus</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        </>
      ) : null}

      {profile.role === "teknisi" && effectiveStatus === "ditugaskan" ? (
        <>
          {startError ? <Text style={styles.error}>{startError}</Text> : null}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.startButtonText}>Start (ambil foto "before")</Text>
            )}
          </TouchableOpacity>
        </>
      ) : null}

      {profile.role === "teknisi" && effectiveStatus === "dikerjakan" ? (
        <>
          {pendingError ? <Text style={styles.error}>{pendingError}</Text> : null}
          {isSettingPending ? (
            <>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Catatan kendala (wajib)"
                value={pendingNotes}
                onChangeText={setPendingNotes}
                multiline
              />
              <View style={styles.pendingButtonRow}>
                <TouchableOpacity
                  style={styles.pendingCancelButton}
                  onPress={() => {
                    setIsSettingPending(false);
                    setPendingNotes("");
                    setPendingError(null);
                  }}
                  disabled={isSubmittingPending}
                >
                  <Text style={styles.pendingCancelButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pendingButton,
                    styles.pendingSubmitButton,
                    !pendingNotes.trim() && styles.buttonDisabled,
                  ]}
                  onPress={handleSubmitPending}
                  disabled={isSubmittingPending || !pendingNotes.trim()}
                >
                  {isSubmittingPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.pendingButtonText}>Kirim</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.pendingButton}
              onPress={() => setIsSettingPending(true)}
            >
              <Text style={styles.pendingButtonText}>Tandai Pending</Text>
            </TouchableOpacity>
          )}
        </>
      ) : null}

      {profile.role === "teknisi" &&
      effectiveStatus === "dikerjakan" &&
      requiresEvidenceChecklist(detail.jenis) ? (
        <>
          <Text style={styles.subtitle}>Checklist Bukti</Text>
          {evidenceError ? <Text style={styles.error}>{evidenceError}</Text> : null}

          <View style={styles.evidenceList}>
            {EVIDENCE_FOTO_TYPES.map((type) => {
              const done = isEvidenceFotoDone(evidenceStatus, type);
              return (
                <View key={type} style={styles.evidenceRow}>
                  <View style={[styles.evidenceCheck, done && styles.evidenceCheckDone]}>
                    {done ? <Text style={styles.evidenceCheckMark}>✓</Text> : null}
                  </View>
                  <Text style={styles.evidenceLabel}>{EVIDENCE_FOTO_LABEL[type]}</Text>
                  {!done ? (
                    <TouchableOpacity
                      style={styles.evidenceButton}
                      onPress={() => handleUploadEvidence(type)}
                      disabled={uploadingEvidenceType === type}
                    >
                      {uploadingEvidenceType === type ? (
                        <ActivityIndicator size="small" color={KRISTEK_TEAL} />
                      ) : (
                        <Text style={styles.evidenceButtonText}>Ambil Foto</Text>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}

            <View style={[styles.evidenceRow, styles.evidenceRowLast]}>
              <View style={[styles.evidenceCheck, evidenceStatus.lokasi && styles.evidenceCheckDone]}>
                {evidenceStatus.lokasi ? <Text style={styles.evidenceCheckMark}>✓</Text> : null}
              </View>
              <Text style={styles.evidenceLabel}>Lokasi Rumah Pelanggan</Text>
              {evidenceStatus.lokasi && detail.evidenceLokasi ? (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${detail.evidenceLokasi!.latitude},${detail.evidenceLokasi!.longitude}`
                    )
                  }
                >
                  <Text style={styles.evidenceLokasiLink}>Lihat di Maps</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.evidenceButton}
                  onPress={handleCaptureLokasi}
                  disabled={isCapturingLokasi}
                >
                  {isCapturingLokasi ? (
                    <ActivityIndicator size="small" color={KRISTEK_TEAL} />
                  ) : (
                    <Text style={styles.evidenceButtonText}>Ambil Lokasi</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.endButton, !isEvidenceComplete(evidenceStatus) && styles.buttonDisabled]}
            onPress={handleFinishWithEvidence}
            disabled={!isEvidenceComplete(evidenceStatus) || isFinishingWithEvidence}
          >
            {isFinishingWithEvidence ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.endButtonText}>Tandai Selesai</Text>
            )}
          </TouchableOpacity>
        </>
      ) : null}

      {profile.role === "teknisi" &&
      effectiveStatus === "dikerjakan" &&
      !requiresEvidenceChecklist(detail.jenis) ? (
        <>
          {endError ? <Text style={styles.error}>{endError}</Text> : null}
          <TouchableOpacity
            style={styles.endButton}
            onPress={handleEnd}
            disabled={isEnding}
          >
            {isEnding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.endButtonText}>End (ambil foto "after")</Text>
            )}
          </TouchableOpacity>
        </>
      ) : null}

      {detail.status === "selesai" && detail.startedAt && detail.endedAt ? (
        <Text style={styles.detailLine}>
          Durasi Kerja:{" "}
          {formatDurasiKerja(
            computeDurasiKerjaSeconds(
              detail.startedAt,
              detail.endedAt,
              detail.accumulatedPendingSeconds
            )
          )}
        </Text>
      ) : null}

      {profile.role === "teknisi" && effectiveStatus === "pending" ? (
        <>
          {resumeError ? <Text style={styles.error}>{resumeError}</Text> : null}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleLanjut}
            disabled={isResuming}
          >
            {isResuming ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.startButtonText}>Lanjut</Text>
            )}
          </TouchableOpacity>
        </>
      ) : null}

      {(profile.role === "admin" || profile.role === "pemilik") &&
      detail.status !== "selesai" &&
      detail.status !== "dibatalkan" ? (
        <>
          {cancelError ? <Text style={styles.error}>{cancelError}</Text> : null}
          {isConfirmingCancel ? (
            <>
              <Text style={styles.detailLine}>
                Yakin batalkan Tiket ini? Tindakan ini tidak bisa dibatalkan.
              </Text>
              <View style={styles.pendingButtonRow}>
                <TouchableOpacity
                  style={styles.pendingCancelButton}
                  onPress={() => {
                    setIsConfirmingCancel(false);
                    setCancelError(null);
                  }}
                  disabled={isCancelling}
                >
                  <Text style={styles.pendingCancelButtonText}>Tidak</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelTiketButton, styles.pendingSubmitButton]}
                  onPress={handleCancelTiket}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.cancelTiketButtonText}>Ya, Batalkan Tiket</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.cancelTiketButton}
              onPress={() => setIsConfirmingCancel(true)}
            >
              <Text style={styles.cancelTiketButtonText}>Batalkan Tiket</Text>
            </TouchableOpacity>
          )}
        </>
      ) : null}

      {canResetTiketData(profile.role) ? (
        <TouchableOpacity
          style={styles.deleteTiketButton}
          onPress={() => setIsDeleteTiketConfirmVisible(true)}
        >
          <Text style={styles.deleteTiketButtonText}>Hapus Paksa Tiket Ini</Text>
        </TouchableOpacity>
      ) : null}

      {statusLog.length > 0 ? (
        <>
          <Text style={styles.subtitle}>Riwayat Status</Text>
          <View style={styles.timeline}>
            {statusLog.map((entry, index) => (
              <View key={entry.id} style={styles.timelineRow}>
                <View style={styles.timelineDotColumn}>
                  <View style={styles.timelineDot} />
                  {index < statusLog.length - 1 ? (
                    <View style={styles.timelineLine} />
                  ) : null}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>
                    {STATUS_LABEL[entry.status] ?? entry.status}
                  </Text>
                  <Text style={styles.timelineDate}>
                    {formatTanggalJam(entry.changedAt)}
                  </Text>
                  {entry.notes ? (
                    <Text style={styles.timelineNotes}>{entry.notes}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <DeleteConfirmModal
        visible={isDeleteTiketConfirmVisible}
        itemLabel={`Tiket ${detail.pelanggan?.nama ?? JENIS_LABEL[detail.jenis] ?? detail.jenis}`}
        error={deleteTiketError}
        isDeleting={isDeletingTiket}
        onCancel={() => setIsDeleteTiketConfirmVisible(false)}
        onConfirm={handleDeleteTiket}
      />

      <DeleteConfirmModal
        visible={deleteFotoTarget !== null}
        itemLabel={
          deleteFotoTarget
            ? `Foto ${FOTO_TYPE_LABEL[deleteFotoTarget.type] ?? deleteFotoTarget.type}`
            : ""
        }
        error={deleteFotoError}
        isDeleting={isDeletingFoto}
        onCancel={() => setDeleteFotoTarget(null)}
        onConfirm={handleDeleteFoto}
      />

      <Modal
        visible={viewingFoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingFoto(null)}
      >
        <TouchableOpacity
          style={styles.fotoViewerBackdrop}
          activeOpacity={1}
          onPress={() => setViewingFoto(null)}
        >
          {viewingFoto ? (
            <>
              <Image
                source={{ uri: viewingFoto.url }}
                style={styles.fotoViewerImage}
                resizeMode="contain"
              />
              <View style={styles.fotoViewerTimestampBadge}>
                <Text style={styles.fotoViewerTimestampText}>
                  {FOTO_TYPE_LABEL[viewingFoto.type] ?? viewingFoto.type} ·{" "}
                  {formatTanggalJam(viewingFoto.uploadedAt)}
                </Text>
                {viewingFoto.latitude != null && viewingFoto.longitude != null ? (
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${viewingFoto.latitude},${viewingFoto.longitude}`
                      )
                    }
                  >
                    <Text style={styles.fotoViewerAlamatLink}>📍 Buka Lokasi Foto di Maps</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.fotoViewerAlamatText}>📍 Lokasi tidak tercatat</Text>
                )}
              </View>
            </>
          ) : null}
          <TouchableOpacity
            style={styles.fotoViewerCloseButton}
            onPress={() => setViewingFoto(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.fotoViewerCloseText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  detailLine: {
    marginTop: 2,
    color: "#6b7280",
    fontSize: 13,
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
  mapsButton: {
    marginTop: 10,
    backgroundColor: "#E7F1F5",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  mapsButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: KRISTEK_TEAL,
  },
  quoteBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    borderLeftWidth: 3,
    borderLeftColor: KRISTEK_TEAL,
    padding: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  quoteText: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: "#DC2626",
    marginTop: 12,
  },
  offlineNotice: {
    marginTop: 8,
    fontSize: 12,
    color: "#92400E",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
  },
  syncFailureBox: {
    marginTop: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 12,
  },
  syncFailureText: {
    fontSize: 12,
    color: "#991B1B",
    marginBottom: 4,
  },
  retrySyncButton: {
    marginTop: 4,
    alignSelf: "flex-start",
  },
  retrySyncButtonText: {
    color: KRISTEK_TEAL,
    fontWeight: "600",
    fontSize: 12,
  },
  startButton: {
    backgroundColor: KRISTEK_TEAL,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
    shadowColor: KRISTEK_TEAL,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
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
    marginTop: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  pendingButton: {
    backgroundColor: "#D97706",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#D97706",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pendingButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  pendingButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  pendingSubmitButton: {
    flex: 1,
    marginTop: 0,
  },
  pendingCancelButton: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  pendingCancelButtonText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 15,
  },
  evidenceList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    marginTop: 4,
  },
  evidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f2",
  },
  evidenceRowLast: {
    borderBottomWidth: 0,
  },
  evidenceCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  evidenceCheckDone: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  evidenceCheckMark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  evidenceLabel: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  evidenceButton: {
    backgroundColor: "#E7F1F5",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  evidenceButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: KRISTEK_TEAL,
  },
  evidenceLokasiLink: {
    fontSize: 12,
    fontWeight: "700",
    color: KRISTEK_TEAL,
  },
  teknisiChangeButton: {
    marginTop: 4,
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eef0f2",
  },
  teknisiChangeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: KRISTEK_TEAL,
  },
  teknisiEditBox: {
    padding: 14,
  },
  teknisiEditList: {
    gap: 8,
  },
  teknisiEditRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  teknisiEditRowSelected: {
    backgroundColor: "#EAF3F7",
    borderColor: KRISTEK_TEAL,
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
    backgroundColor: KRISTEK_TEAL,
    borderColor: KRISTEK_TEAL,
  },
  checkmark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  teknisiEditInfo: {
    flex: 1,
    flexShrink: 1,
  },
  teknisiEditName: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  teknisiEditWilayah: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  endButton: {
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#059669",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  endButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  cancelTiketButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#DC2626",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cancelTiketButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  deleteTiketButton: {
    backgroundColor: "#7F1D1D",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#7F1D1D",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  deleteTiketButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  fotoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  fotoItem: {
    width: "47%",
  },
  fotoImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  fotoLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
  },
  fotoTimestamp: {
    marginTop: 2,
    fontSize: 10,
    color: "#9ca3af",
    textAlign: "center",
  },
  fotoAlamat: {
    marginTop: 2,
    fontSize: 10,
    color: "#9ca3af",
    textAlign: "center",
  },
  fotoAlamatLink: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: KRISTEK_TEAL,
    textAlign: "center",
  },
  fotoDeleteText: {
    marginTop: 2,
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
    textAlign: "center",
  },
  fotoViewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  fotoViewerImage: {
    width: "100%",
    height: "80%",
  },
  fotoViewerCloseButton: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  fotoViewerCloseText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  fotoViewerTimestampBadge: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    maxWidth: "85%",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  fotoViewerTimestampText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  fotoViewerAlamatText: {
    color: "#e5e7eb",
    fontSize: 12,
    marginTop: 3,
    textAlign: "center",
  },
  fotoViewerAlamatLink: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },
  timeline: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  timelineRow: {
    flexDirection: "row",
  },
  timelineDotColumn: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: KRISTEK_TEAL,
    marginTop: 4,
    borderWidth: 2,
    borderColor: "#E7F1F5",
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#e5e7eb",
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
    paddingLeft: 10,
  },
  timelineStatus: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 14,
  },
  timelineDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
  },
  timelineNotes: {
    fontSize: 12,
    color: "#4b5563",
    marginTop: 3,
    fontStyle: "italic",
  },
});
