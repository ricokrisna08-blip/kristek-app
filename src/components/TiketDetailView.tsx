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
import { batalkanTiket } from "../tiket/batalkanTiket";
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
};

export function TiketDetailView({ detail, profile, onBack, onChanged }: Props) {
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

  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Paket</Text>
              <Text style={styles.infoValue}>{detail.pelanggan.paketNama ?? "-"}</Text>
            </View>
          </View>
        </>
      ) : null}

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
                <Text style={styles.fotoLabel}>
                  {foto.type === "before" ? "Before" : "After"}
                </Text>
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

      {profile.role === "teknisi" && effectiveStatus === "dikerjakan" ? (
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
        visible={deleteFotoTarget !== null}
        itemLabel={
          deleteFotoTarget
            ? `Foto ${deleteFotoTarget.type === "before" ? "Before" : "After"}`
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
                  {viewingFoto.type === "before" ? "Before" : "After"} ·{" "}
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
