import { useCallback, useEffect, useState } from "react";
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
import { getLaporanKeuangan, type LaporanBulananItem } from "../laporan/getLaporanKeuangan";
import {
  listPengeluaranBulanIni,
  type PengeluaranItem,
} from "../pengeluaran/listPengeluaranBulanIni";
import { createPengeluaran } from "../pengeluaran/createPengeluaran";
import { deletePengeluaran } from "../pengeluaran/deletePengeluaran";
import type { UserProfile } from "../auth/profile";
import { ScreenHeader } from "../components/ScreenHeader";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { DateField, toDateString } from "../components/DateField";

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

function formatAngka(value: number): string {
  return value.toLocaleString("en-US");
}

function formatHarga(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

const COL = {
  bulan: 70,
  totalUser: 74,
  omset: 108,
  sudahBayar: 108,
  belumBayar: 108,
  diTanganDc: 108,
  pengeluaran: 108,
  sisa: 108,
  persen: 60,
};

const KATEGORI_QUICK_PICKS = ["Gaji", "Bandwidth", "Listrik", "Investor", "Lainnya"];

type Mode = "nominal" | "persen";

export function LaporanKeuanganScreen({ profile, onBack }: Props) {
  const [items, setItems] = useState<LaporanBulananItem[]>([]);
  const [pengeluaranItems, setPengeluaranItems] = useState<PengeluaranItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [kategori, setKategori] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [mode, setMode] = useState<Mode>("nominal");
  const [nominalInput, setNominalInput] = useState("");
  const [persenInput, setPersenInput] = useState("");
  const [tanggal, setTanggal] = useState(toDateString(new Date()));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PengeluaranItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sudahBayarBulanIni = items.find((i) => i.isBulanIni)?.sudahBayar ?? 0;

  const reload = useCallback(async () => {
    const laporan = await getLaporanKeuangan(supabase);
    setItems(laporan);
    const sudahBayarIni = laporan.find((i) => i.isBulanIni)?.sudahBayar ?? 0;
    const pengeluaran = await listPengeluaranBulanIni(supabase, sudahBayarIni);
    setPengeluaranItems(pengeluaran);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function openForm() {
    setKategori("");
    setKeterangan("");
    setMode("nominal");
    setNominalInput("");
    setPersenInput("");
    setTanggal(toDateString(new Date()));
    setFormError(null);
    setIsFormVisible(true);
  }

  async function handleSave() {
    setFormError(null);
    setIsSaving(true);
    const result = await createPengeluaran(supabase, {
      kategori,
      keterangan,
      nominal: mode === "nominal" ? Number(nominalInput) || null : null,
      persen: mode === "persen" ? Number(persenInput) || null : null,
      tanggal,
      createdBy: profile.id,
    });
    setIsSaving(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    setIsFormVisible(false);
    await reload();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deletePengeluaran(supabase, deleteTarget.id);
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
        title="Laporan Keuangan"
        subtitle={`${items.length} bulan tercatat`}
        onBack={onBack}
        right={
          <TouchableOpacity style={styles.addButton} onPress={openForm}>
            <Text style={styles.addButtonText}>+ Catat Pengeluaran</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <View style={styles.sectionCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={[styles.row, styles.headerRow]}>
                <Text style={[styles.headerCell, { width: COL.bulan }]}>Bulan</Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.totalUser }]}>
                  Total User
                </Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.omset }]}>
                  Omset
                </Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.sudahBayar }]}>
                  Sudah Bayar
                </Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.belumBayar }]}>
                  Belum Bayar
                </Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.diTanganDc }]}>
                  Di Tangan DC
                </Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.pengeluaran }]}>
                  Pengeluaran
                </Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.sisa }]}>
                  Sisa Uang
                </Text>
                <Text style={[styles.headerCell, styles.numCell, { width: COL.persen }]}>%</Text>
              </View>

              {items.map((item) => (
                <View
                  key={item.periode}
                  style={[styles.row, item.isBulanIni && styles.rowCurrent]}
                >
                  <View style={[styles.cellWrap, { width: COL.bulan }]}>
                    <Text style={styles.cellBulan}>{item.label}</Text>
                    {item.isBulanIni ? (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Bulan ini</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.cell, styles.numCell, { width: COL.totalUser }]}>
                    {item.totalUser}
                  </Text>
                  <Text style={[styles.cell, styles.cellBold, styles.numCell, { width: COL.omset }]}>
                    {formatAngka(item.omset)}
                  </Text>
                  <Text
                    style={[styles.cell, styles.cellSuccess, styles.numCell, { width: COL.sudahBayar }]}
                  >
                    {item.sudahBayar > 0 ? formatAngka(item.sudahBayar) : "-"}
                  </Text>
                  <Text
                    style={[styles.cell, styles.cellDanger, styles.numCell, { width: COL.belumBayar }]}
                  >
                    {item.belumBayar > 0 ? formatAngka(item.belumBayar) : "-"}
                  </Text>
                  <Text
                    style={[styles.cell, styles.cellWarning, styles.numCell, { width: COL.diTanganDc }]}
                  >
                    {item.diTanganDc > 0 ? formatAngka(item.diTanganDc) : "-"}
                  </Text>
                  <Text
                    style={[styles.cell, styles.cellDanger, styles.numCell, { width: COL.pengeluaran }]}
                  >
                    {item.totalPengeluaran > 0 ? formatAngka(item.totalPengeluaran) : "-"}
                  </Text>
                  <Text
                    style={[
                      styles.cell,
                      styles.cellBold,
                      item.sisaUang < 0 ? styles.cellDanger : styles.cellSuccess,
                      styles.numCell,
                      { width: COL.sisa },
                    ]}
                  >
                    {formatAngka(item.sisaUang)}
                  </Text>
                  <Text style={[styles.cell, styles.numCell, { width: COL.persen }]}>
                    {item.persen % 1 === 0 ? item.persen : item.persen.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
      <Text style={styles.note}>
        Angka bulan ini sudah menghitung kebijakan Pemilik yang aktif per pelanggan:
        Prorata (pelanggan baru join di tengah siklus) dan Kompensasi Gangguan
        (subsidi gangguan layanan) -- keduanya otomatis mengurangi tagihan efektif,
        lalu balik normal lagi di siklus berikutnya. Kolom "Di Tangan DC" adalah
        bagian dari Belum Bayar yang sudah dicentang DC ("sudah bayar ke saya")
        tapi masih menunggu approval Pemilik -- uangnya sudah bukan lagi di
        Pelanggan, tapi belum resmi lunas sampai di-Setujui. "Sisa Uang" = Sudah
        Bayar dikurangi Pengeluaran bulan itu -- baris pengeluaran yang diisi
        Persen (%) dihitung otomatis dari Sudah Bayar bulan itu, ikut naik/turun
        kalau ada pelanggan baru bayar.
      </Text>

      {!isLoading ? (
        <View style={styles.pengeluaranSection}>
          <Text style={styles.subtitle}>Pengeluaran Bulan Ini</Text>
          {pengeluaranItems.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada pengeluaran dicatat bulan ini.</Text>
          ) : (
            pengeluaranItems.map((p) => (
              <View key={p.id} style={styles.pengeluaranRow}>
                <View style={styles.pengeluaranBody}>
                  <View style={styles.pengeluaranTitleRow}>
                    <View style={styles.kategoriBadge}>
                      <Text style={styles.kategoriBadgeText}>{p.kategori}</Text>
                    </View>
                    <Text style={styles.pengeluaranKeterangan}>{p.keterangan}</Text>
                  </View>
                  <Text style={styles.pengeluaranMeta}>
                    {p.persen != null ? `${p.persen}% · ` : ""}
                    {formatHarga(p.efektif)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setDeleteError(null);
                    setDeleteTarget(p);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      ) : null}
      </ScrollView>

      <Modal
        visible={isFormVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFormVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.formCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formTitle}>Catat Pengeluaran</Text>

              <Text style={styles.fieldLabel}>Kategori</Text>
              <View style={styles.pillRow}>
                {KATEGORI_QUICK_PICKS.map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={[styles.pill, kategori === k && styles.pillSelected]}
                    onPress={() => setKategori(k)}
                  >
                    <Text style={kategori === k ? styles.pillTextSelected : styles.pillText}>
                      {k}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Kategori (mis. Gaji, Bandwidth, ...)"
                placeholderTextColor="#9ca3af"
                value={kategori}
                onChangeText={setKategori}
              />

              <Text style={styles.fieldLabel}>Keterangan</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Gaji Awe, BIZNET, RT 02"
                placeholderTextColor="#9ca3af"
                value={keterangan}
                onChangeText={setKeterangan}
              />

              <Text style={styles.fieldLabel}>Jenis Nilai</Text>
              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={[styles.pill, mode === "nominal" && styles.pillSelected]}
                  onPress={() => setMode("nominal")}
                >
                  <Text style={mode === "nominal" ? styles.pillTextSelected : styles.pillText}>
                    Nominal (Rp)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pill, mode === "persen" && styles.pillSelected]}
                  onPress={() => setMode("persen")}
                >
                  <Text style={mode === "persen" ? styles.pillTextSelected : styles.pillText}>
                    Persen (%) dari Sudah Bayar
                  </Text>
                </TouchableOpacity>
              </View>

              {mode === "nominal" ? (
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: 1500000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={nominalInput}
                  onChangeText={setNominalInput}
                />
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: 3 (untuk 3%)"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={persenInput}
                    onChangeText={setPersenInput}
                  />
                  <Text style={styles.sectionHint}>
                    Dihitung otomatis: {persenInput || "0"}% x {formatHarga(sudahBayarBulanIni)} ={" "}
                    {formatHarga(
                      Math.round(((Number(persenInput) || 0) * sudahBayarBulanIni) / 100)
                    )}
                  </Text>
                </>
              )}

              <Text style={styles.fieldLabel}>Tanggal</Text>
              <DateField value={tanggal} onChange={setTanggal} />

              {formError ? <Text style={styles.error}>{formError}</Text> : null}

              <View style={styles.formButtonRow}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => setIsFormVisible(false)}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.saveButton]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Simpan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DeleteConfirmModal
        visible={deleteTarget !== null}
        itemLabel={deleteTarget?.keterangan ?? ""}
        error={deleteError}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}

const KRISTEK_TEAL = "#1B7396";
const KRISTEK_NAVY = "#0B2D5B";

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
  loading: {
    marginVertical: 12,
  },
  addButton: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12.5,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerRow: {
    borderBottomWidth: 2,
    borderBottomColor: "#E4E7EB",
  },
  rowCurrent: {
    backgroundColor: "#E7F1F5",
    borderRadius: 8,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: "700",
    color: KRISTEK_NAVY,
  },
  cellWrap: {
    paddingRight: 8,
  },
  cell: {
    fontSize: 13,
    color: "#111827",
    paddingRight: 8,
  },
  cellBulan: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  cellBold: {
    fontWeight: "700",
  },
  cellSuccess: {
    color: "#059669",
    fontWeight: "600",
  },
  cellDanger: {
    color: "#DC2626",
    fontWeight: "600",
  },
  cellWarning: {
    color: "#B45309",
    fontWeight: "600",
  },
  numCell: {
    textAlign: "right",
  },
  currentBadge: {
    marginTop: 3,
    backgroundColor: KRISTEK_TEAL,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: "flex-start",
  },
  currentBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  note: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17,
    color: "#64748B",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: KRISTEK_NAVY,
    marginBottom: 10,
  },
  pengeluaranSection: {
    marginTop: 24,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 13,
  },
  pengeluaranRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    padding: 12,
    marginBottom: 8,
  },
  pengeluaranBody: {
    flex: 1,
  },
  pengeluaranTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  kategoriBadge: {
    backgroundColor: "#E7F1F5",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  kategoriBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: KRISTEK_TEAL,
  },
  pengeluaranKeterangan: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    flexShrink: 1,
  },
  pengeluaranMeta: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
    marginTop: 4,
  },
  deleteIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  backdrop: {
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
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  sectionHint: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: -6,
    marginBottom: 12,
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
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  pillSelected: {
    backgroundColor: KRISTEK_TEAL,
    borderColor: KRISTEK_TEAL,
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
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  error: {
    color: "#DC2626",
    marginBottom: 10,
  },
  formButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  formButton: {
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
  saveButton: {
    backgroundColor: KRISTEK_TEAL,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
