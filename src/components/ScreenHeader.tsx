import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "./BackButton";

const KRISTEK_NAVY = "#0B2D5B";

type Props = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  // Slot buat aksi di kanan header (mis. tombol "+ Tambah"), sejajar
  // dengan BackButton.
  right?: ReactNode;
};

// Header 2-warna (banner navy + body abu-abu) yang dipakai konsisten di
// semua layar, sama gayanya kayak hero di Beranda -- supaya app kerasa
// satu sistem, bukan campuran layar polos & layar dengan aksen warna.
export function ScreenHeader({ title, subtitle, onBack, backLabel, right }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
      <View style={styles.topRow}>
        <BackButton onPress={onBack} label={backLabel} variant="dark" />
        {right}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: KRISTEK_NAVY,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
});
