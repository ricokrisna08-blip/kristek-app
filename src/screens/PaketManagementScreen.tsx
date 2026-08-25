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
import { updatePaket } from "../paket/updatePaket";
import { deletePaket } from "../paket/deletePaket";
import { listPaket, type Paket } from "../paket/listPaket";
import { ConfirmModal } from "../components/ConfirmModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { ScreenHeader } from "../components/ScreenHeader";

type Props = {
  onBack: () => void;
};

function formatHarga(harga: number | null): string {
  if (harga == null) return "Belum diisi";
  return `Rp${harga.toLocaleString("id-ID")}`;
}

export function PaketManagementScreen({ onBack }: Props) {
  const [paketList, setPaketList] = useState<Paket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [harga, setHarga] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Paket | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNama, setEditingNama] = useState("");
  const [editingHarga, setEditingHarga] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
    const result = await createPaket(supabase, nama, harga.trim() ? Number(harga) : null);
    setIsSubmitting(false);

    if (!result.success) {
      setIsConfirmVisible(false);
      setError(result.error);
      return;
    }

    setIsConfirmVisible(false);
    setNama("");
    setHarga("");
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

  function handleStartEdit(item: Paket) {
    setEditingId(item.id);
    setEditingNama(item.nama);
    setEditingHarga(item.harga != null ? String(item.harga) : "");
    setEditError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditingNama("");
    setEditingHarga("");
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setEditError(null);
    setIsSavingEdit(true);
    const result = await updatePaket(
      supabase,
      editingId,
      editingNama,
      editingHarga.trim() ? Number(editingHarga) : null
    );
    setIsSavingEdit(false);

    if (!result.success) {
      setEditError(result.error);
      return;
    }

    setEditingId(null);
    setEditingNama("");
    setEditingHarga("");
    await reload();
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Manajemen Paket"
        subtitle={`${paketList.length} Paket terdaftar`}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : paketList.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada Paket.</Text>
      ) : (
        <View style={styles.list}>
          {paketList.map((item) =>
            editingId === item.id ? (
              <View key={item.id} style={styles.editCard}>
                <Text style={styles.fieldLabel}>Nama Paket</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: 30 Mbps"
                  placeholderTextColor="#9ca3af"
                  value={editingNama}
                  onChangeText={setEditingNama}
                />
                <Text style={styles.fieldLabel}>Harga</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: 165000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={editingHarga}
                  onChangeText={setEditingHarga}
                />
                {editError ? <Text style={styles.error}>{editError}</Text> : null}
                <View style={styles.editButtonRow}>
                  <TouchableOpacity
                    style={styles.editCancelButton}
                    onPress={handleCancelEdit}
                    disabled={isSavingEdit}
                  >
                    <Text style={styles.editCancelText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editSaveButton, isSavingEdit && styles.buttonDisabled]}
                    onPress={handleSaveEdit}
                    disabled={isSavingEdit}
                  >
                    <Text style={styles.buttonText}>
                      {isSavingEdit ? "Menyimpan..." : "Simpan"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.nama}</Text>
                  <Text style={styles.cardHarga}>{formatHarga(item.harga)}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStartEdit(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.editLink}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setDeleteError(null);
                      setDeleteTarget(item);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.deleteLink}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          )}
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.subtitle}>Tambah Paket Baru</Text>

        <Text style={styles.fieldLabel}>Nama Paket</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: 30 Mbps"
          placeholderTextColor="#9ca3af"
          value={nama}
          onChangeText={setNama}
        />

        <Text style={styles.fieldLabel}>Harga</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: 165000"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={harga}
          onChangeText={setHarga}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, !nama.trim() && styles.buttonDisabled]}
          onPress={() => setIsConfirmVisible(true)}
          disabled={!nama.trim()}
        >
          <Text style={styles.buttonText}>Tambah Paket</Text>
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={isConfirmVisible}
        title="Konfirmasi Paket Baru"
        fields={[
          { label: "Nama Paket", value: nama },
          { label: "Harga", value: harga.trim() ? formatHarga(Number(harga)) : "(kosong)" },
        ]}
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
    marginTop: 8,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
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
  cardInfo: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  cardHarga: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  editLink: {
    color: "#1B7396",
    fontSize: 13,
    fontWeight: "600",
  },
  deleteLink: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
  },
  editCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#1B7396",
    padding: 16,
    marginBottom: 10,
    shadowColor: "#1B7396",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  editButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  editCancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f1f1f1",
  },
  editCancelText: {
    color: "#333",
    fontWeight: "600",
  },
  editSaveButton: {
    flex: 1,
    backgroundColor: "#1B7396",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
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
