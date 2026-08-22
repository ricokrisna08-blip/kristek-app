import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import {
  listInstalasiEvidence,
  REQUIRED_EVIDENCE_COUNT,
  type InstalasiEvidenceItem,
} from "../tiket/listInstalasiEvidence";
import { formatRelativeTanggal } from "../tiket/formatRelativeTanggal";
import { getTiketDetail, type TiketDetail } from "../tiket/getTiketDetail";
import { TiketDetailView } from "../components/TiketDetailView";
import { ScreenHeader } from "../components/ScreenHeader";
import type { UserProfile } from "../auth/profile";

type Props = {
  profile: UserProfile;
  onBack: () => void;
};

type FilterTab = "menunggu" | "selesai";

function isLengkap(item: InstalasiEvidenceItem): boolean {
  return item.evidenceCount >= REQUIRED_EVIDENCE_COUNT;
}

export function InstallationEvidenceScreen({ profile, onBack }: Props) {
  const [items, setItems] = useState<InstalasiEvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("menunggu");
  const [detail, setDetail] = useState<TiketDetail | null>(null);

  async function reload() {
    const result = await listInstalasiEvidence(supabase);
    setItems(result);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelect(item: InstalasiEvidenceItem) {
    setIsLoadingDetail(true);
    const tiketDetail = await getTiketDetail(supabase, item.id);
    setIsLoadingDetail(false);
    setDetail(tiketDetail);
  }

  async function handleChanged() {
    if (!detail) return;
    const refreshed = await getTiketDetail(supabase, detail.id);
    setDetail(refreshed);
    await reload();
  }

  if (isLoadingDetail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (detail) {
    return (
      <TiketDetailView
        detail={detail}
        profile={profile}
        onBack={() => setDetail(null)}
        onChanged={handleChanged}
      />
    );
  }

  const menungguCount = items.filter((item) => !isLengkap(item)).length;
  const selesaiCount = items.length - menungguCount;
  const filteredItems = items.filter((item) =>
    filter === "menunggu" ? !isLengkap(item) : isLengkap(item)
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Installation Evidence"
        subtitle="Dokumentasi foto untuk pekerjaan instalasi kamu"
        onBack={onBack}
      />
      <View style={styles.container}>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, filter === "menunggu" && styles.chipActive]}
            onPress={() => setFilter("menunggu")}
          >
            <Text style={[styles.chipText, filter === "menunggu" && styles.chipTextActive]}>
              Menunggu · {menungguCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, filter === "selesai" && styles.chipActive]}
            onPress={() => setFilter("selesai")}
          >
            <Text style={[styles.chipText, filter === "selesai" && styles.chipTextActive]}>
              Selesai · {selesaiCount}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>{filter === "menunggu" ? "📸" : "✅"}</Text>
                <Text style={styles.emptyText}>
                  {filter === "menunggu"
                    ? "Semua Tiket kamu sudah lengkap bukti instalasinya."
                    : "Belum ada Tiket yang lengkap bukti instalasinya."}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const lengkap = isLengkap(item);
              const progress = item.evidenceCount / REQUIRED_EVIDENCE_COUNT;
              return (
                <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardTitleBlock}>
                      <Text style={styles.jobName} numberOfLines={1}>
                        {item.pelangganNama}
                      </Text>
                      <Text style={styles.jobId}>{item.nomorPelanggan}</Text>
                    </View>
                    <View style={[styles.statusPill, lengkap ? styles.statusDone : styles.statusPending]}>
                      <Text style={[styles.statusPillText, lengkap ? styles.statusDoneText : styles.statusPendingText]}>
                        {lengkap ? "Lengkap" : "Menunggu Bukti"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.jobMeta}>{formatRelativeTanggal(item.updatedAt)}</Text>

                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          lengkap ? styles.progressFillDone : styles.progressFillPending,
                          { width: `${progress * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressLabel}>
                      {item.evidenceCount}/{REQUIRED_EVIDENCE_COUNT}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    padding: 24,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#E4E7EB",
    backgroundColor: "#FFFFFF",
  },
  chipActive: {
    backgroundColor: KRISTEK_NAVY,
    borderColor: KRISTEK_NAVY,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
  },
  chipTextActive: {
    color: "#fff",
  },
  loading: {
    marginVertical: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 14,
    marginBottom: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitleBlock: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  jobName: {
    fontSize: 14,
    fontWeight: "700",
    color: KRISTEK_NAVY,
  },
  jobId: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusDone: {
    backgroundColor: "#DCFCE7",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusPendingText: {
    color: "#92400E",
  },
  statusDoneText: {
    color: "#15803D",
  },
  jobMeta: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 99,
    backgroundColor: "#EEF0F2",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },
  progressFillPending: {
    backgroundColor: "#E0A83D",
  },
  progressFillDone: {
    backgroundColor: KRISTEK_TEAL,
  },
  progressLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#6b7280",
    flexShrink: 0,
  },
});
