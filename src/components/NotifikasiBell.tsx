import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { listNotifikasi, type Notifikasi, type NotifikasiType } from "../notifikasi/listNotifikasi";
import { markAllNotifikasiRead } from "../notifikasi/markAllNotifikasiRead";
import { unreadNotifikasiCount } from "../notifikasi/unreadNotifikasiCount";
import { subscribeToNotifikasi } from "../notifikasi/subscribeToNotifikasi";
import { notifikasiLabel } from "../notifikasi/notifikasiLabel";

type Props = {
  userId: string;
  onNavigateToTiket: (tiketId: string) => void;
  onNavigateToCuti: () => void;
};

const TYPE_ICON: Record<NotifikasiType, string> = {
  ditugaskan: "📋",
  pending: "⏸️",
  selesai: "✅",
  cuti_diajukan: "🌴",
};

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotifikasiBell({ userId, onNavigateToTiket, onNavigateToCuti }: Props) {
  const [items, setItems] = useState<Notifikasi[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const reload = useCallback(async () => {
    const result = await listNotifikasi(supabase, userId);
    setItems(result);
    return result;
  }, [userId]);

  useEffect(() => {
    reload();
    const unsubscribe = subscribeToNotifikasi(supabase, userId, reload);
    return unsubscribe;
  }, [userId, reload]);

  async function handleOpen() {
    setIsVisible(true);
    const fresh = await reload();
    if (unreadNotifikasiCount(fresh) > 0) {
      await markAllNotifikasiRead(supabase, userId);
      await reload();
    }
  }

  function handleItemPress(item: Notifikasi) {
    setIsVisible(false);
    if (item.type === "cuti_diajukan") {
      onNavigateToCuti();
    } else if (item.tiketId) {
      onNavigateToTiket(item.tiketId);
    }
  }

  const unread = unreadNotifikasiCount(items);

  return (
    <>
      <TouchableOpacity style={styles.bellButton} onPress={handleOpen}>
        <Text style={styles.bellIcon}>🔔</Text>
        {unread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Notifikasi</Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              style={styles.list}
              data={items}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🔔</Text>
                  <Text style={styles.emptyText}>Belum ada notifikasi.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isTappable = item.type === "cuti_diajukan" || item.tiketId !== null;
                return (
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => handleItemPress(item)}
                    disabled={!isTappable}
                  >
                    <View style={styles.itemIcon}>
                      <Text style={styles.itemIconText}>{TYPE_ICON[item.type]}</Text>
                    </View>
                    <View style={styles.itemBody}>
                      <Text style={styles.itemText}>{notifikasiLabel(item)}</Text>
                      <Text style={styles.itemDate}>{formatWaktu(item.createdAt)}</Text>
                    </View>
                    {isTappable ? <Text style={styles.chevron}>›</Text> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const KRISTEK_NAVY = "#0B2D5B";
// Percentage maxHeight nggak selalu resolve di web (butuh ancestor dengan
// definite height) -- pakai angka pixel absolut dari Dimensions supaya
// list-nya konsisten discroll di dalam card, bukan meluber ke luar.
const MODAL_MAX_HEIGHT = Dimensions.get("window").height * 0.75;

const styles = StyleSheet.create({
  bellButton: {
    padding: 8,
  },
  bellIcon: {
    fontSize: 22,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#DC2626",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    width: "100%",
    maxWidth: 420,
    maxHeight: MODAL_MAX_HEIGHT,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f2",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: KRISTEK_NAVY,
  },
  closeIcon: {
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "700",
  },
  list: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#f1f3f5",
    marginHorizontal: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E7F1F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  itemIconText: {
    fontSize: 16,
  },
  itemBody: {
    flex: 1,
    flexShrink: 1,
  },
  itemText: {
    color: "#1f2937",
    fontSize: 13,
    lineHeight: 18,
  },
  itemDate: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 3,
  },
  chevron: {
    fontSize: 20,
    color: "#c7cdd6",
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 8,
    opacity: 0.5,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 13,
  },
});
