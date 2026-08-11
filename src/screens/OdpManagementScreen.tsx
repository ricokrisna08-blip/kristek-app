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
import { createOdp } from "../odp/createOdp";
import { deleteOdp } from "../odp/deleteOdp";
import { listOdp, type OdpListItem } from "../odp/listOdp";
import { listWilayah, type Wilayah } from "../wilayah/listWilayah";
import { canCreateOdp, canDeleteOdp } from "../auth/permissions";
import type { UserProfile } from "../auth/profile";
import { ConfirmModal } from "../components/ConfirmModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { BackButton } from "../components/BackButton";

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton onPress={onBack} />

      <Text style={styles.title}>Manajemen ODP</Text>
      <Text style={styles.count}>{odpList.length} ODP terdaftar</Text>

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

      {canCreateOdp(profile.role) ? (
        <>
          <Text style={styles.subtitle}>Tambah ODP Baru</Text>

          <TextInput
            style={styles.input}
            placeholder="Label (misal ODP-KRTK-001)"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            value={label}
            onChangeText={setLabel}
          />
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
        </>
      ) : null}

      <DeleteConfirmModal
        visible={deleteTarget !== null}
        itemLabel={deleteTarget?.label ?? ""}
        error={deleteError}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
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
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 12,
    marginBottom: 10,
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
    color: "#c0392b",
    fontSize: 13,
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
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
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
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
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
});
