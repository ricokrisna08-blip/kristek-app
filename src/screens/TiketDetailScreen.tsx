import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { supabase } from "../lib/supabase";
import { getTiketDetail, type TiketDetail } from "../tiket/getTiketDetail";
import { TiketDetailView } from "../components/TiketDetailView";
import type { UserProfile } from "../auth/profile";

type Props = {
  tiketId: string;
  profile: UserProfile;
  onBack: () => void;
};

// Entry point terpisah dari MyTiketScreen -- dipakai ketika navigasi langsung
// ke satu Tiket tanpa melalui daftar (mis. tap notifikasi lonceng).
export function TiketDetailScreen({ tiketId, profile, onBack }: Props) {
  const [detail, setDetail] = useState<TiketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const result = await getTiketDetail(supabase, tiketId);
    setDetail(result);
  }, [tiketId]);

  useEffect(() => {
    reload().then(() => setIsLoading(false));
  }, [reload]);

  if (isLoading || !detail) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <TiketDetailView
      detail={detail}
      profile={profile}
      onBack={onBack}
      onChanged={reload}
      onDeleted={onBack}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
});
