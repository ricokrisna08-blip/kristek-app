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
import { createWilayah } from "../wilayah/createWilayah";
import { deleteWilayah } from "../wilayah/deleteWilayah";
import { listWilayah, type Wilayah } from "../wilayah/listWilayah";
import { ConfirmModal } from "../components/ConfirmModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { ScreenHeader } from "../components/ScreenHeader";

type Props = {
  onBack: () => void;
};

export function WilayahManagementScreen({ onBack }: Props) {
  const [wilayahList, setWilayahList] = useState<Wilayah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Wilayah | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function reload() {
    setIsLoading(true);
    setWilayahList(await listWilayah(supabase));
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);
    const result = await createWilayah(supabase, nama);
    setIsSubmitting(false);

    if (!result.success) {
      setIsConfirmVisible(false);
      setError(result.error);
      return;
    }

    setIsConfirmVisible(false);
    setNama("");
    await reload();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteWilayah(supabase, deleteTarget.id);
    setIsDeleting(false);

    if (!result.success) {
      setDeleteError(result.error);
      return;
    }

    setDeleteTarget(null);
    await reload();
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Manajemen Wilayah"
        subtitle={`${wilayahList.length} Wilayah terdaftar`}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.sectionCard}>
        <Text style={styles.subtitle}>Tambah Wilayah Baru</Text>

        <Text style={styles.fieldLabel}>Nama Wilayah</Text>
        <TextInput
          style={styles.input}
          placeholder="Misal: Kelurahan Kemiri Muka"
          placeholderTextColor="#9ca3af"
          value={nama}
          onChangeText={setNama}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, !nama.trim() && styles.buttonDisabled]}
          onPress={() => setIsConfirmVisible(true)}
          disabled={!nama.trim()}
        >
          <Text style={styles.buttonText}>Tambah Wilayah</Text>
        </TouchableOpacity>

        <ConfirmModal
          visible={isConfirmVisible}
          title="Konfirmasi Wilayah Baru"
          fields={[{ label: "Nama Wilayah", value: nama }]}
          isSubmitting={isSubmitting}
          onCancel={() => setIsConfirmVisible(false)}
          onConfirm={handleConfirm}
        />
      </View>

      <Text style={styles.subtitle}>Daftar Wilayah</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : wilayahList.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada Wilayah.</Text>
      ) : (
        <View style={styles.list}>
          {wilayahList.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardName}>{item.nama}</Text>
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
            </View>
          ))}
        </View>
      )}

      <DeleteConfirmModal
        visible={deleteTarget !== null}
        itemLabel={deleteTarget?.nama ?? ""}
        error={deleteError}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
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
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardName: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  deleteLink: {
    color: "#DC2626",
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
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
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
