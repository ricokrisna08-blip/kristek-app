import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import {
  listBelumBayarUntukDc,
  type PelangganBelumBayarDc,
} from "../pelanggan/listBelumBayarUntukDc";
import { flagLunasByDc } from "../pelanggan/flagLunasByDc";
import type { UserProfile } from "../auth/profile";
import { ScreenHeader } from "../components/ScreenHeader";
import { buildWhatsappUrl } from "../pelanggan/waPhone";

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

function formatHarga(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

export function PenagihanDcScreen({ profile, onBack }: Props) {
  const [items, setItems] = useState<PelangganBelumBayarDc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [target, setTarget] = useState<PelangganBelumBayarDc | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openingWaById, setOpeningWaById] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const result = await listBelumBayarUntukDc(supabase, profile.id);
    setItems(result);
  }, [profile.id]);

  useEffect(() => {
    setIsLoading(true);
    reload().then(() => setIsLoading(false));
  }, [reload]);

  // Total yang harus disetor DC ini ke Pemilik -- cuma yang DIA sendiri
  // yang centang (dcFlaggedByMe), bukan total belum-bayar semua Pelanggan.
  // Ini angka checksum: begitu DC ketemu Pemilik buat setor uang cash,
  // dua-duanya bisa cocokin ke angka yang sama persis di sini sebelum
  // Pemilik approve satu-satu.
  const { totalSetor, jumlahPelangganSetor } = useMemo(() => {
    const milikSaya = items.filter((item) => item.dcFlaggedByMe);
    return {
      totalSetor: milikSaya.reduce((sum, item) => sum + item.tagihan, 0),
      jumlahPelangganSetor: milikSaya.length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => item.nama.toLowerCase().includes(query));
  }, [items, searchQuery]);

  async function handleConfirm() {
    if (!target) return;
    setIsSaving(true);
    setError(null);
    const nextFlagged = !target.dcFlaggedByMe;
    const result = await flagLunasByDc(supabase, target.id, nextFlagged);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setTarget(null);
    await reload();
  }

  async function handleOpenWhatsapp(item: PelangganBelumBayarDc) {
    if (!item.noHp) return;
    setOpeningWaById(item.id);
    try {
      const url = buildWhatsappUrl(item.noHp);
      // Sengaja TIDAK cek Linking.canOpenURL() dulu -- di Android 11+
      // (targetSdk 30+) itu sering balikin false buat link https:// gara-gara
      // pembatasan package visibility, walau openURL()-nya sendiri tetap
      // bisa jalan normal. Sama seperti link Google Maps di TiketDetailView.
      await Linking.openURL(url);
    } catch {
      setError("Tidak bisa membuka WhatsApp untuk nomor ini.");
    } finally {
      setOpeningWaById(null);
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Penagihan"
        subtitle={`${items.length} Pelanggan belum bayar`}
        onBack={onBack}
      />
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama Pelanggan"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {jumlahPelangganSetor > 0 ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Total setor ke Pemilik ({jumlahPelangganSetor} Pelanggan)
            </Text>
            <Text style={styles.summaryValue}>{formatHarga(totalSetor)}</Text>
            <Text style={styles.summaryHint}>
              Cocokkan angka ini waktu serahin uang cash ke Pemilik, sebelum dia Setujui
              satu-satu.
            </Text>
          </View>
        ) : null}
        {isLoading ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "Tidak ada Pelanggan yang cocok."
                  : "Semua Pelanggan sudah bayar bulan ini."}
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.cardRow}>
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => setTarget(item)}
                  disabled={item.dcFlaggedLunas && !item.dcFlaggedByMe}
                >
                  <View style={styles.cardBody}>
                    {item.prioritasDc ? (
                      <Text style={styles.prioritasBadge}>🔥 Prioritas</Text>
                    ) : null}
                    <Text style={styles.cardName}>{item.nama}</Text>
                    <Text style={styles.cardAlamat}>{item.alamat}</Text>
                    <TouchableOpacity
                      onPress={() => handleOpenWhatsapp(item)}
                      disabled={openingWaById === item.id}
                    >
                      <Text style={styles.cardNoHp}>{item.noHp}</Text>
                    </TouchableOpacity>
                    <Text style={styles.cardHarga}>{formatHarga(item.tagihan)}</Text>
                    {item.catatan ? (
                      <Text style={styles.cardCatatan}>📝 {item.catatan}</Text>
                    ) : null}
                    {item.dcFlaggedLunas ? (
                      <Text style={styles.pendingLabel}>
                        {item.dcFlaggedByMe
                          ? "Menunggu approval Pemilik — tap untuk batal"
                          : "Menunggu approval Pemilik"}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      item.dcFlaggedLunas && styles.checkboxChecked,
                    ]}
                  >
                    {item.dcFlaggedLunas ? <Text style={styles.checkboxMark}>✓</Text> : null}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.waButton,
                    openingWaById === item.id && styles.waButtonDisabled,
                  ]}
                  onPress={() => handleOpenWhatsapp(item)}
                  disabled={openingWaById === item.id || !item.noHp}
                >
                  <Text style={styles.waButtonText}>
                    {openingWaById === item.id ? "..." : "WhatsApp"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <Modal
        visible={target !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTarget(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {target?.dcFlaggedByMe ? "Batal tandai sudah bayar?" : "Tandai sudah bayar?"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {target?.dcFlaggedByMe
                ? `${target?.nama} akan kembali muncul sebagai belum bayar.`
                : `${target?.nama} sudah bayar ${target ? formatHarga(target.tagihan) : ""} ke kamu? Pemilik akan diminta approve setoran ini.`}
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setTarget(null)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirm}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Ya</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flex: 1,
    padding: 16,
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
  summaryCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 14,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#92400E",
    marginTop: 2,
  },
  summaryHint: {
    fontSize: 11,
    color: "#B45309",
    marginTop: 6,
  },
  loading: {
    marginTop: 24,
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 24,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 14,
  },
  cardBody: {
    flex: 1,
  },
  prioritasBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    marginBottom: 4,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  cardAlamat: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  cardNoHp: {
    fontSize: 12,
    color: "#1d4ed8",
    marginTop: 2,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  waButton: {
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  waButtonDisabled: {
    opacity: 0.7,
  },
  waButtonText: {
    color: "#166534",
    fontWeight: "700",
    fontSize: 11,
  },
  cardHarga: {
    fontSize: 14,
    fontWeight: "600",
    color: KRISTEK_TEAL,
    marginTop: 6,
  },
  cardCatatan: {
    fontSize: 12,
    color: "#374151",
    marginTop: 6,
    fontStyle: "italic",
  },
  pendingLabel: {
    fontSize: 11,
    color: "#B45309",
    marginTop: 6,
    fontWeight: "600",
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: "#B45309",
    borderColor: "#B45309",
  },
  checkboxMark: {
    color: "#fff",
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    width: "100%",
    maxWidth: 420,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 12,
  },
  error: {
    color: "#DC2626",
    marginBottom: 12,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f1f1",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: KRISTEK_TEAL,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
