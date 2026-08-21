import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export type DropdownOption = { id: string; label: string };

type Props = {
  title: string;
  valueLabel: string;
  options: DropdownOption[];
  onSelect: (id: string) => void;
  variant?: "inline" | "field";
  searchable?: boolean;
};

export function Dropdown({
  title,
  valueLabel,
  options,
  onSelect,
  variant = "inline",
  searchable = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isField = variant === "field";

  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : options;

  function close() {
    setIsOpen(false);
    setSearchQuery("");
  }

  return (
    <>
      <TouchableOpacity
        style={isField ? styles.fieldBox : styles.inlineField}
        onPress={() => setIsOpen(true)}
      >
        <Text style={isField ? styles.fieldBoxText : styles.inlineFieldText} numberOfLines={1}>
          {valueLabel || "Pilih..."}
        </Text>
        <Text style={isField ? styles.chevronBox : styles.inlineChevron}>⌄</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close}>
          {/* Tanpa TouchableWithoutFeedback ini, tap di MANA PUN di dalam
              sheet (termasuk search box) nge-bubble ke onPress backdrop di
              atas dan langsung nutup modal -- TextInput, beda dari
              TouchableOpacity, tidak otomatis "mengklaim" touch responder,
              jadi tap di dalamnya tetap diteruskan ke parent. */}
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <Text style={styles.title}>{title}</Text>
              {searchable ? (
                <View style={styles.searchBox}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Cari..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                  />
                </View>
              ) : null}
              <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
                {filteredOptions.length === 0 ? (
                  <Text style={styles.emptyText}>Tidak ditemukan.</Text>
                ) : (
                  filteredOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.option}
                      onPress={() => {
                        onSelect(option.id);
                        close();
                      }}
                    >
                      <Text style={styles.optionText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  inlineField: {
    flex: 1,
    marginLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  inlineFieldText: {
    fontSize: 15,
    color: "#1B7396",
    fontWeight: "600",
    textAlign: "right",
  },
  inlineChevron: {
    fontSize: 13,
    color: "#1B7396",
  },
  fieldBox: {
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
  fieldBoxText: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  chevronBox: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: "70%",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
  },
  scroll: {
    maxHeight: 360,
  },
  option: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f2",
  },
  optionText: {
    fontSize: 15,
    color: "#111827",
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 24,
  },
});
