import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
import { createThrowawaySupabaseClient } from "../lib/createThrowawaySupabaseClient";
import { createAccount } from "../accounts/createAccount";
import { listAccounts, type AccountListItem } from "../accounts/listAccounts";
import { resetPassword } from "../accounts/resetPassword";
import { deleteAccount } from "../accounts/deleteAccount";
import { listWilayah, type Wilayah } from "../wilayah/listWilayah";
import type { Role } from "../domain/types";
import { ConfirmModal } from "../components/ConfirmModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { ScreenHeader } from "../components/ScreenHeader";

type Props = {
  onBack: () => void;
};

type FormState = {
  nama: string;
  alamat: string;
  noTelp: string;
  username: string;
  password: string;
  role: Extract<Role, "admin" | "teknisi">;
  wilayahId: string | null;
};

const EMPTY_FORM: FormState = {
  nama: "",
  alamat: "",
  noTelp: "",
  username: "",
  password: "",
  role: "teknisi",
  wilayahId: null,
};

// Percentage maxHeight nggak selalu resolve di web (butuh ancestor dengan
// definite height) -- pakai angka pixel absolut supaya form card-nya
// konsisten discroll di dalam batasnya, bukan meluber sampai tombol
// "Lanjutkan" ketutup/di luar jangkauan layar.
const FORM_CARD_MAX_HEIGHT = Dimensions.get("window").height * 0.88;

const ROLE_BADGE_COLOR: Record<string, { bg: string; text: string }> = {
  admin: { bg: "#dbeafe", text: "#1e40af" },
  teknisi: { bg: "#dcfce7", text: "#166534" },
};

export function AccountManagementScreen({ onBack }: Props) {
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [wilayahList, setWilayahList] = useState<Wilayah[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isExitConfirmVisible, setIsExitConfirmVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [actionTarget, setActionTarget] = useState<AccountListItem | null>(null);
  const [resetTarget, setResetTarget] = useState<AccountListItem | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AccountListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function reload() {
    setIsLoading(true);
    const [accountsResult, wilayahResult] = await Promise.all([
      listAccounts(supabase),
      listWilayah(supabase),
    ]);
    setAccounts(accountsResult);
    setWilayahList(wilayahResult);
    setForm((prev) => ({
      ...prev,
      wilayahId: prev.wilayahId ?? wilayahResult[0]?.id ?? null,
    }));
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  function closeFormDiscardingChanges() {
    setIsExitConfirmVisible(false);
    setIsFormVisible(false);
    setError(null);
    setForm({ ...EMPTY_FORM, wilayahId: form.wilayahId });
  }

  function openCreateForm() {
    setError(null);
    setForm((prev) => ({ ...EMPTY_FORM, wilayahId: prev.wilayahId }));
    setIsFormVisible(true);
  }

  async function handleConfirm() {
    setError(null);

    if (!form.wilayahId) {
      setIsConfirmVisible(false);
      setError("Pilih Wilayah terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    const result = await createAccount(createThrowawaySupabaseClient(), supabase, {
      nama: form.nama,
      alamat: form.alamat,
      noTelp: form.noTelp,
      username: form.username,
      password: form.password,
      role: form.role,
      wilayahId: form.wilayahId,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setIsConfirmVisible(false);
      setError(result.error);
      return;
    }

    setIsConfirmVisible(false);
    setIsFormVisible(false);
    setForm({ ...EMPTY_FORM, wilayahId: form.wilayahId });
    await reload();
  }

  function openResetModal(account: AccountListItem) {
    setActionTarget(null);
    setResetTarget(account);
    setResetPasswordValue("");
    setResetError(null);
    setResetSuccess(false);
  }

  async function handleResetPassword() {
    if (!resetTarget) return;
    setResetError(null);
    setIsResetting(true);
    const result = await resetPassword(supabase, resetTarget.id, resetPasswordValue);
    setIsResetting(false);

    if (!result.success) {
      setResetError(result.error);
      return;
    }

    setResetSuccess(true);
  }

  async function handleDeleteAccount() {
    if (!deleteTarget) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteAccount(supabase, deleteTarget.id);
    setIsDeleting(false);

    if (!result.success) {
      setDeleteError(result.error);
      return;
    }

    setDeleteTarget(null);
    await reload();
  }

  const filteredAccounts = accounts.filter((account) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      account.nama.toLowerCase().includes(query) ||
      account.username.toLowerCase().includes(query)
    );
  });

  const selectedWilayahNama =
    wilayahList.find((w) => w.id === form.wilayahId)?.nama ?? "-";

  const canSubmit =
    !isSubmitting &&
    form.nama &&
    form.alamat &&
    form.noTelp &&
    form.username &&
    form.password &&
    form.wilayahId;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Manajemen Akun"
        subtitle={`${accounts.length} akun Admin/Teknisi terdaftar`}
        onBack={onBack}
        right={
          <TouchableOpacity
            style={styles.addButton}
            onPress={openCreateForm}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.addButtonText}>+ Tambah Akun</Text>
          </TouchableOpacity>
        }
      />
      <View style={styles.container}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama atau username"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          style={styles.list}
          data={filteredAccounts}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery ? "Tidak ada akun yang cocok." : "Belum ada akun Admin/Teknisi."}
            </Text>
          }
          renderItem={({ item }) => {
            const badge = ROLE_BADGE_COLOR[item.role] ?? ROLE_BADGE_COLOR.teknisi;
            return (
              <View style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.nama.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.nama}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>
                        {item.role === "admin" ? "Admin" : "Teknisi"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardDetail}>
                    @{item.username} · {item.wilayahNama ?? "Wilayah belum diset"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => setActionTarget(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.menuButtonText}>⋮</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
      </View>

      {/* Menu aksi per akun */}
      <Modal
        visible={actionTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActionTarget(null)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setActionTarget(null)}
        >
          <View style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>{actionTarget?.nama}</Text>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => actionTarget && openResetModal(actionTarget)}
            >
              <Text style={styles.actionRowText}>🔑 Reset Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setDeleteError(null);
                setDeleteTarget(actionTarget);
                setActionTarget(null);
              }}
            >
              <Text style={[styles.actionRowText, styles.actionRowDanger]}>
                🗑️ Hapus Akun
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCancel}
              onPress={() => setActionTarget(null)}
            >
              <Text style={styles.actionCancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Form buat akun baru */}
      <Modal
        visible={isFormVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsExitConfirmVisible(true)}
      >
        <View style={styles.backdrop}>
          <View style={styles.formCard}>
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>Tambah Akun Baru</Text>

              <TextInput
                style={styles.input}
                placeholder="Nama"
                value={form.nama}
                onChangeText={(nama) => setForm((f) => ({ ...f, nama }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Alamat"
                value={form.alamat}
                onChangeText={(alamat) => setForm((f) => ({ ...f, alamat }))}
              />
              <TextInput
                style={styles.input}
                placeholder="No. Telp"
                keyboardType="phone-pad"
                value={form.noTelp}
                onChangeText={(noTelp) => setForm((f) => ({ ...f, noTelp }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Username"
                autoCapitalize="none"
                autoCorrect={false}
                value={form.username}
                onChangeText={(username) => setForm((f) => ({ ...f, username }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={form.password}
                onChangeText={(password) => setForm((f) => ({ ...f, password }))}
              />

              <Text style={styles.formLabel}>Role</Text>
              <View style={styles.pillRow}>
                {(["admin", "teknisi"] as const).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.pill, form.role === role && styles.pillSelected]}
                    onPress={() => setForm((f) => ({ ...f, role }))}
                  >
                    <Text
                      style={form.role === role ? styles.pillTextSelected : styles.pillText}
                    >
                      {role === "admin" ? "Admin" : "Teknisi"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Wilayah</Text>
              <View style={styles.pillRow}>
                {wilayahList.map((wilayah) => (
                  <TouchableOpacity
                    key={wilayah.id}
                    style={[
                      styles.pill,
                      form.wilayahId === wilayah.id && styles.pillSelected,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, wilayahId: wilayah.id }))}
                  >
                    <Text
                      style={
                        form.wilayahId === wilayah.id
                          ? styles.pillTextSelected
                          : styles.pillText
                      }
                    >
                      {wilayah.nama}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.formButtonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsFormVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.formSubmitButton,
                    !canSubmit && styles.buttonDisabled,
                  ]}
                  onPress={() => setIsConfirmVisible(true)}
                  disabled={!canSubmit}
                >
                  <Text style={styles.buttonText}>Lanjutkan</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Konfirmasi keluar dari form saat back HP ditekan */}
      <Modal
        visible={isExitConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsExitConfirmVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card2}>
            <Text style={styles.title}>Yakin Keluar?</Text>
            <Text style={styles.subtitleText}>
              Data yang sudah diisi di form Tambah Akun akan hilang jika keluar sekarang.
            </Text>
            <View style={styles.resetButtonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsExitConfirmVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={closeFormDiscardingChanges}
              >
                <Text style={styles.buttonText}>Ya, Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={isConfirmVisible}
        title="Konfirmasi Akun Baru"
        fields={[
          { label: "Nama", value: form.nama },
          { label: "Alamat", value: form.alamat },
          { label: "No. Telp", value: form.noTelp },
          { label: "Username", value: form.username },
          { label: "Password", value: form.password ? "••••••••" : "" },
          { label: "Role", value: form.role === "admin" ? "Admin" : "Teknisi" },
          { label: "Wilayah", value: selectedWilayahNama },
        ]}
        isSubmitting={isSubmitting}
        onCancel={() => setIsConfirmVisible(false)}
        onConfirm={handleConfirm}
      />

      <Modal
        visible={resetTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setResetTarget(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card2}>
            {resetSuccess ? (
              <>
                <Text style={styles.title}>Password Direset</Text>
                <Text style={styles.subtitleText}>
                  Password {resetTarget?.nama} berhasil diganti. Beri tahu password
                  barunya langsung ke orangnya (tidak dikirim otomatis lewat apa pun).
                </Text>
                <TouchableOpacity style={styles.button} onPress={() => setResetTarget(null)}>
                  <Text style={styles.buttonText}>Tutup</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitleText}>
                  Akun: {resetTarget?.nama} (@{resetTarget?.username})
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password baru"
                  secureTextEntry
                  value={resetPasswordValue}
                  onChangeText={setResetPasswordValue}
                />
                {resetError ? <Text style={styles.error}>{resetError}</Text> : null}
                <View style={styles.resetButtonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setResetTarget(null)}
                    disabled={isResetting}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.resetSubmitButton,
                      !resetPasswordValue && styles.buttonDisabled,
                    ]}
                    onPress={handleResetPassword}
                    disabled={isResetting || !resetPasswordValue}
                  >
                    {isResetting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Reset</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <DeleteConfirmModal
        visible={deleteTarget !== null}
        itemLabel={deleteTarget?.nama ?? ""}
        error={deleteError}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAccount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  back: {
    color: "#1B7396",
    fontSize: 15,
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
  subtitleText: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 24,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  loading: {
    marginTop: 24,
  },
  list: {
    flex: 1,
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1B7396",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flexShrink: 1,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardDetail: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  menuButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  menuButtonText: {
    fontSize: 20,
    color: "#9ca3af",
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  actionSheetTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
  },
  actionRow: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  actionRowText: {
    fontSize: 16,
    color: "#111827",
  },
  actionRowDanger: {
    color: "#DC2626",
  },
  actionCancel: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
  },
  actionCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  formCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: FORM_CARD_MAX_HEIGHT,
    overflow: "hidden",
  },
  formScroll: {
    flex: 1,
    minHeight: 0,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  formButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  formSubmitButton: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
    padding: 15,
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
    fontWeight: "600",
  },
  card2: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 420,
  },
  resetButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f1f1f1",
  },
  resetSubmitButton: {
    flex: 1,
  },
  dangerButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
});
