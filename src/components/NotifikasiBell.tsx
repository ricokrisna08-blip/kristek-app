import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { listNotifikasi, type Notifikasi } from "../notifikasi/listNotifikasi";
import { markAllNotifikasiRead } from "../notifikasi/markAllNotifikasiRead";
import { unreadNotifikasiCount } from "../notifikasi/unreadNotifikasiCount";
import { subscribeToNotifikasi } from "../notifikasi/subscribeToNotifikasi";
import { notifikasiLabel } from "../notifikasi/notifikasiLabel";

type Props = {
  userId: string;
};

export function NotifikasiBell({ userId }: Props) {
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
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>Notifikasi</Text>

            <FlatList
              style={styles.list}
              data={items}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text>Belum ada notifikasi.</Text>}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <Text style={styles.itemText}>{notifikasiLabel(item)}</Text>
                </View>
              )}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Text style={styles.closeButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

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
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    maxHeight: "70%",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  list: {
    marginBottom: 12,
  },
  item: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: {
    color: "#111",
  },
  closeButton: {
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#333",
    fontWeight: "600",
  },
});
