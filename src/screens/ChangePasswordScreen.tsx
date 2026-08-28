import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";
import { changePassword } from "../auth/changePassword";
import { ScreenHeader } from "../components/ScreenHeader";

type Props = {
  onBack: () => void;
};

export function ChangePasswordScreen({ onBack }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = Boolean(newPassword.trim() && confirmPassword.trim());

  async function handleSubmit() {
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    const result = await changePassword(supabase, newPassword, confirmPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setSuccess(true);
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Ganti Password"
        subtitle="Isi password baru untuk akun kamu"
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>Password Baru</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimal 6 karakter"
            placeholderTextColor="#9ca3af"
            value={newPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              setSuccess(false);
            }}
            secureTextEntry
          />

          <Text style={styles.fieldLabel}>Konfirmasi Password Baru</Text>
          <TextInput
            style={styles.input}
            placeholder="Ulangi password baru"
            placeholderTextColor="#9ca3af"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setSuccess(false);
            }}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>Password berhasil diganti.</Text> : null}

          <TouchableOpacity
            style={[styles.button, (!canSubmit || isSubmitting) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            <Text style={styles.buttonText}>{isSubmitting ? "Menyimpan..." : "Simpan Password"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const KRISTEK_TEAL = "#1B7396";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EB",
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111827",
    marginBottom: 12,
  },
  error: {
    color: "#DC2626",
    marginBottom: 10,
  },
  success: {
    color: "#16A34A",
    marginBottom: 10,
  },
  button: {
    backgroundColor: KRISTEK_TEAL,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: KRISTEK_TEAL,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
