import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  onPress: () => void;
  label?: string;
};

export function BackButton({ onPress, label = "Kembali" }: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>‹</Text>
      </View>
      <Text style={styles.text}>{label}</Text>
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
  icon: {
    color: "#1B7396",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: -2,
  },
  text: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
});
