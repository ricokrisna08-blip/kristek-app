import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

// @react-native-community/datetimepicker punya nol dukungan web (cuma
// no-op + console warning "DateTimePicker is not supported on: web") --
// jadi di web pakai <input type="date"> HTML asli lewat createElement,
// bukan JSX, supaya nggak perlu nambah DOM JSX types ke project React
// Native ini cuma buat satu elemen ini.
import { createElement } from "react";

type Props = {
  // Kolom `date` murni ("YYYY-MM-DD"). Boleh kosong -- kalau kosong,
  // tampil `placeholder` (native) atau kotak input date kosong (web).
  value: string;
  onChange: (value: string) => void;
  minimumDate?: Date;
  placeholder?: string;
};

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateString(value: string): Date {
  return value ? new Date(`${value}T00:00:00`) : new Date();
}

// Ditambah "T00:00:00" supaya di-parse sebagai waktu lokal, bukan
// tengah malam UTC yang bisa geser mundur satu hari.
export function formatTanggal(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DateField({ value, onChange, minimumDate, placeholder }: Props) {
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  if (Platform.OS === "web") {
    return createElement("input", {
      type: "date",
      value,
      min: minimumDate ? toDateString(minimumDate) : undefined,
      onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      style: webInputStyle,
    });
  }

  function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setIsPickerVisible(false);
    if (event.type !== "set" || !selectedDate) return;
    onChange(toDateString(selectedDate));
  }

  return (
    <>
      <TouchableOpacity style={styles.dateField} onPress={() => setIsPickerVisible(true)}>
        <Text style={value ? styles.dateFieldText : styles.dateFieldPlaceholder}>
          {value ? formatTanggal(value) : placeholder ?? "Pilih tanggal"}
        </Text>
        <Text style={styles.dateFieldIcon}>📅</Text>
      </TouchableOpacity>
      {isPickerVisible ? (
        <DateTimePicker
          value={parseDateString(value)}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onChange={handleChange}
        />
      ) : null}
    </>
  );
}

const webInputStyle = {
  borderWidth: 1,
  borderColor: "#e5e7eb",
  backgroundColor: "#f9fafb",
  borderRadius: 12,
  padding: 13,
  fontSize: 15,
  color: "#111827",
  marginBottom: 12,
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
} as const;

const styles = StyleSheet.create({
  dateField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  dateFieldText: {
    fontSize: 15,
    color: "#111827",
  },
  dateFieldPlaceholder: {
    fontSize: 15,
    color: "#9ca3af",
  },
  dateFieldIcon: {
    fontSize: 15,
  },
});
