import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  onPress: () => void;
  label?: string;
};

export function BackButton({ onPress, label = "Kembali" }: Props) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Text style={styles.text}>{"‹ " + label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  text: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
});
