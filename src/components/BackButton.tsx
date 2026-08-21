import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  onPress: () => void;
  label?: string;
  // "light" (default) buat dipakai di atas background terang -- circle biru
  // muda, teks gelap. "dark" buat dipakai di atas hero navy (ScreenHeader):
  // circle putih transparan, teks putih, biar tetap kebaca.
  variant?: "light" | "dark";
};

export function BackButton({ onPress, label = "Kembali", variant = "light" }: Props) {
  const isDark = variant === "dark";
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
        <Text style={[styles.icon, isDark && styles.iconDark]}>‹</Text>
      </View>
      <Text style={[styles.text, isDark && styles.textDark]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
    paddingVertical: 4,
    paddingRight: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconCircleDark: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  icon: {
    color: "#1B7396",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: -2,
  },
  iconDark: {
    color: "#fff",
  },
  text: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
  textDark: {
    color: "#fff",
  },
});
