import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";
import { listTiket, type TiketListItem } from "../tiket/listTiket";
import { getTiketDetail, type TiketDetail } from "../tiket/getTiketDetail";
import { TiketDetailView } from "../components/TiketDetailView";
import { BackButton } from "../components/BackButton";
import type { UserProfile } from "../auth/profile";
import type { TiketJenis } from "../tiket/createTiketWithAssignment";
import { JENIS_LABEL, STATUS_LABEL } from "../tiket/labels";

const JENIS_ICON: Record<string, string> = {
  instalasi: "🛠️",
  gangguan_komplain: "⚠️",
  maintenance: "🔧",
};

const STATUS_BADGE_COLOR: Record<string, { bg: string; text: string }> = {
  baru: { bg: "#f3f4f6", text: "#374151" },
  ditugaskan: { bg: "#dbeafe", text: "#1e40af" },
  dikerjakan: { bg: "#dbeafe", text: "#1e40af" },
  pending: { bg: "#fef3c7", text: "#92400e" },
  selesai: { bg: "#dcfce7", text: "#166534" },
  dibatalkan: { bg: "#fee2e2", text: "#991b1b" },
};

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function judulTiket(item: TiketListItem): string {
  if (item.jenis === "maintenance") {
    return item.odpLabel ? `Maintenance — ${item.odpLabel}` : "Maintenance";
  }
  return item.pelangganNama ?? "Pelanggan tidak diketahui";
}

type Props = {
  profile: UserProfile;
  title: string;
  jenisFilter?: TiketJenis;
  onBack: () => void;
};

export function MyTiketScreen({ profile, title, jenisFilter, onBack }: Props) {
  const [tiketList, setTiketList] = useState<TiketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<TiketDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  async function reloadList() {
    const all = await listTiket(supabase);
    setTiketList(jenisFilter ? all.filter((t) => t.jenis === jenisFilter) : all);
  }

  useEffect(() => {
    reloadList().then(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jenisFilter]);

  async function handleSelect(item: TiketListItem) {
    setIsLoadingDetail(true);
    const detail = await getTiketDetail(supabase, item.id);
    setSelectedDetail(detail);
    setIsLoadingDetail(false);
  }

  async function handleChanged() {
    if (!selectedDetail) return;
    const refreshed = await getTiketDetail(supabase, selectedDetail.id);
    setSelectedDetail(refreshed);
    await reloadList();
  }

  if (isLoadingDetail) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (selectedDetail) {
    return (
      <TiketDetailView
        detail={selectedDetail}
        profile={profile}
        onBack={() => setSelectedDetail(null)}
        onChanged={handleChanged}
      />
    );
  }

  return (
    <View style={styles.container}>
      <BackButton onPress={onBack} />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.count}>{tiketList.length} Tiket</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={tiketList}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Belum ada Tiket yang ditugaskan ke Anda.</Text>
          }
          renderItem={({ item }) => {
            const badge = STATUS_BADGE_COLOR[item.status] ?? STATUS_BADGE_COLOR.baru;
            return (
              <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
                <View style={styles.cardIcon}>
                  <Text style={styles.cardIconText}>{JENIS_ICON[item.jenis] ?? "🎫"}</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {judulTiket(item)}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>
                        {STATUS_LABEL[item.status] ?? item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDetail}>{JENIS_LABEL[item.jenis] ?? item.jenis}</Text>
                  <Text style={styles.itemDate}>{formatTanggal(item.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  loading: {
    marginVertical: 12,
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
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    flexShrink: 1,
    fontWeight: "600",
    fontSize: 15,
    color: "#111827",
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
  itemDetail: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 3,
  },
  itemDate: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
  },
});
