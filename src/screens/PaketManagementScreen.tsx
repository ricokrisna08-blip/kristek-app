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
import { createPaket } from "../paket/createPaket";
import { deletePaket } from "../paket/deletePaket";
import { listPaket, type Paket } from "../paket/listPaket";
import { ConfirmModal } from "../components/ConfirmModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { BackButton } from "../components/BackButton";

type Props = {
  onBack: () => void;
};

export function PaketManagementScreen({ onBack }: Props) {
  const [paketList, setPaketList] = useState<Paket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Paket | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function reload() {
    setIsLoading(true);
    setPaketList(await listPaket(supabase));
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);
    const result = await createPaket(supabase, nama);
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
    const result = await deletePaket(supabase, deleteTarget.id);
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

      <Text style={styles.title}>Manajemen Paket</Text>
      <Text style={styles.count}>{paketList.length} Paket terdaftar</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : paketList.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada Paket.</Text>
      ) : (
        <View style={styles.list}>
          {paketList.map((item) => (
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

      <Text style={styles.subtitle}>Tambah Paket Baru</Text>

      <TextInput
        style={styles.input}
        placeholder="Nama Paket (misal 30 Mbps)"
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
        <Text style={styles.buttonText}>Tambah Paket</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={isConfirmVisible}
        title="Konfirmasi Paket Baru"
        fields={[{ label: "Nama Paket", value: nama }]}
        isSubmitting={isSubmitting}
        onCancel={() => setIsConfirmVisible(false)}
        onConfirm={handleConfirm}
      />

      <DeleteConfirmModal
        visible={deleteTarget !== null}
        itemLabel={deleteTarget?.nama ?? ""}
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
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
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
