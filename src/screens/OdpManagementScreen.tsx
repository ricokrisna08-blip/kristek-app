import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { createOdp } from "../odp/createOdp";
import { deleteOdp } from "../odp/deleteOdp";
import { updateOdp } from "../odp/updateOdp";
import { listOdp, type OdpListItem } from "../odp/listOdp";
import { listWilayah, type Wilayah } from "../wilayah/listWilayah";
import { canCreateOdp, canDeleteOdp, canEditOdp } from "../auth/permissions";
import type { UserProfile } from "../auth/profile";
import { ConfirmModal } from "../components/ConfirmModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { ScreenHeader } from "../components/ScreenHeader";

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

export function OdpManagementScreen({ profile, onBack }: Props) {
  const [odpList, setOdpList] = useState<OdpListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [wilayahList, setWilayahList] = useState<Wilayah[]>([]);
  const [selectedWilayahId, setSelectedWilayahId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<OdpListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editTarget, setEditTarget] = useState<OdpListItem | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editLokasi, setEditLokasi] = useState("");
  const [editWilayahId, setEditWilayahId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const isPemilik = profile.role === "pemilik";

  async function reload() {
    setIsLoading(true);
    const [odpResult, wilayahResult] = await Promise.all([
      listOdp(supabase),
      isPemilik ? listWilayah(supabase) : Promise.resolve([]),
    ]);
    setOdpList(odpResult);
    if (isPemilik) {
      setWilayahList(wilayahResult);
      setSelectedWilayahId((prev) => prev ?? wilayahResult[0]?.id ?? null);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConfirm() {
    setError(null);

    const wilayahId = isPemilik ? selectedWilayahId : profile.wilayahId;

    if (!wilayahId) {
      setIsConfirmVisible(false);
      setError(
        isPemilik
          ? "Belum ada Wilayah — buat Wilayah dulu di Kelola Wilayah."
          : "Akun Anda belum punya Wilayah — hubungi Pemilik."
      );
      return;
    }

    setIsSubmitting(true);
    const result = await createOdp(supabase, {
      label,
      lokasi,
      wilayahId,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setIsConfirmVisible(false);
      setError(result.error);
      return;
    }

    setIsConfirmVisible(false);
    setLabel("");
    setLokasi("");
    await reload();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteOdp(supabase, deleteTarget.id);
    setIsDeleting(false);

    if (!result.success) {
      setDeleteError(result.error);
      return;
    }

    setDeleteTarget(null);
    await reload();
  }

  function openEdit(item: OdpListItem) {
    setEditError(null);
    setEditTarget(item);
    setEditLabel(item.label);
    setEditLokasi(item.lokasi);
    setEditWilayahId(item.wilayahId);
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    if (!editLabel.trim() || !editLokasi.trim() || (isPemilik && !editWilayahId)) return;

    setEditError(null);
    setIsSavingEdit(true);
    const result = await updateOdp(supabase, editTarget.id, {
      label: editLabel.trim(),
      lokasi: editLokasi.trim(),
      wilayahId: (isPemilik ? editWilayahId : editTarget.wilayahId) as string,
    });
    setIsSavingEdit(false);

    if (!result.success) {
      setEditError(result.error);
      return;
    }

    setEditTarget(null);
    await reload();
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Manajemen ODP"
        subtitle={`${odpList.length} ODP terdaftar`}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.container}>
      {canCreateOdp(profile.role) ? (
        <View style={styles.sectionCard}>
          <Text style={styles.subtitle}>Tambah ODP Baru</Text>

          <Text style={styles.fieldLabel}>Label</Text>
          <TextInput
            style={styles.input}
            placeholder="Misal ODP-KRTK-0001"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            value={label}
            onChangeText={setLabel}
          />

          <Text style={styles.fieldLabel}>Lokasi</Text>
          <TextInput
            style={styles.input}
            placeholder="Lokasi / alamat singkat"
            placeholderTextColor="#9ca3af"
            value={lokasi}
            onChangeText={setLokasi}
          />

          {isPemilik ? (
            <>
              <Text style={styles.fieldLabel}>Wilayah</Text>
              {wilayahList.length === 0 ? (
                <Text style={styles.error}>
                  Belum ada Wilayah — buat Wilayah dulu di Kelola Wilayah.
                </Text>
              ) : (
                <View style={styles.pillRow}>
                  {wilayahList.map((wilayah) => (
                    <TouchableOpacity
                      key={wilayah.id}
                      style={[
                        styles.pill,
                        selectedWilayahId === wilayah.id && styles.pillSelected,
                      ]}
                      onPress={() => setSelectedWilayahId(wilayah.id)}
                    >
                      <Text
                        style={
                          selectedWilayahId === wilayah.id
                            ? styles.pillTextSelected
                            : styles.pillText
                        }
                      >
                        {wilayah.nama}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.button,
              (!label.trim() ||
                !lokasi.trim() ||
                (isPemilik && !selectedWilayahId)) &&
                styles.buttonDisabled,
            ]}
            onPress={() => setIsConfirmVisible(true)}
            disabled={!label.trim() || !lokasi.trim() || (isPemilik && !selectedWilayahId)}
          >
            <Text style={styles.buttonText}>Tambah ODP</Text>
          </TouchableOpacity>

          <ConfirmModal
            visible={isConfirmVisible}
            title="Konfirmasi ODP Baru"
            fields={[
              { label: "Label", value: label },
              { label: "Lokasi", value: lokasi },
              ...(isPemilik
                ? [
                    {
                      label: "Wilayah",
                      value: wilayahList.find((w) => w.id === selectedWilayahId)?.nama ?? "-",
                    },
                  ]
                : []),
            ]}
            isSubmitting={isSubmitting}
            onCancel={() => setIsConfirmVisible(false)}
            onConfirm={handleConfirm}
          />
        </View>
      ) : null}

      <Text style={styles.subtitle}>Daftar ODP</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : odpList.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada ODP.</Text>
      ) : (
        <View style={styles.list}>
          {odpList.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>📡</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardLabel}>{item.label}</Text>
                <Text style={styles.cardDetail}>
                  {item.lokasi} · {item.wilayahNama ?? "Wilayah tidak diketahui"}
                </Text>
              </View>
              {canEditOdp(profile.role) ? (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => openEdit(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              ) : null}
              {canDeleteOdp(profile.role) ? (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    setDeleteError(null);
                    setDeleteTarget(item);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteLink}>Hapus</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <DeleteConfirmModal
        visible={deleteTarget !== null}
        itemLabel={deleteTarget?.label ?? ""}
        error={deleteError}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <Modal
        visible={editTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditTarget(null)}
      >
        <View style={styles.editBackdrop}>
          <View style={styles.editCard}>
            <Text style={styles.title}>Edit ODP</Text>

            <Text style={styles.fieldLabel}>Label</Text>
            <TextInput
              style={styles.input}
              placeholder="Misal ODP-KRTK-0001"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
              value={editLabel}
              onChangeText={setEditLabel}
            />

            <Text style={styles.fieldLabel}>Lokasi</Text>
            <TextInput
              style={styles.input}
              placeholder="Lokasi / alamat singkat"
              placeholderTextColor="#9ca3af"
              value={editLokasi}
              onChangeText={setEditLokasi}
            />

            {isPemilik ? (
              <>
                <Text style={styles.fieldLabel}>Wilayah</Text>
                <View style={styles.pillRow}>
                  {wilayahList.map((wilayah) => (
                    <TouchableOpacity
                      key={wilayah.id}
                      style={[
                        styles.pill,
                        editWilayahId === wilayah.id && styles.pillSelected,
                      ]}
                      onPress={() => setEditWilayahId(wilayah.id)}
                    >
                      <Text
                        style={
                          editWilayahId === wilayah.id
                            ? styles.pillTextSelected
                            : styles.pillText
                        }
                      >
                        {wilayah.nama}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}

            {editError ? <Text style={styles.error}>{editError}</Text> : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditTarget(null)}
                disabled={isSavingEdit}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!editLabel.trim() ||
                    !editLokasi.trim() ||
                    (isPemilik && !editWilayahId)) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleSaveEdit}
                disabled={
                  isSavingEdit ||
                  !editLabel.trim() ||
                  !editLokasi.trim() ||
                  (isPemilik && !editWilayahId)
                }
              >
                {isSavingEdit ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 16,
    marginBottom: 8,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
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
  list: {
    marginBottom: 4,
  },
  emptyText: {
    color: "#6b7280",
    paddingVertical: 8,
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
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardIconText: {
    fontSize: 18,
  },
  cardBody: {
    flex: 1,
    flexShrink: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  cardDetail: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginLeft: 8,
  },
  deleteLink: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
  },
  editLink: {
    color: "#1B7396",
    fontSize: 13,
    fontWeight: "600",
  },
  editBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  editCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f1f1f1",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#1B7396",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  pillSelected: {
    backgroundColor: "#1B7396",
    borderColor: "#1B7396",
  },
  pillText: {
    color: "#374151",
    fontSize: 13,
  },
  pillTextSelected: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  error: {
    color: "#DC2626",
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
});
