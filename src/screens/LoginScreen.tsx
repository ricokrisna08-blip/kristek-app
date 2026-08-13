import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { signIn } from "../auth/signIn";

type Props = {
  onSignedIn: (userId: string) => void;
};

export function LoginScreen({ onSignedIn }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const insets = useSafeAreaInsets();

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    const result = await signIn(supabase, username.trim(), password);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onSignedIn(result.userId);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.hero, { paddingTop: insets.top + 40 }]}>
        <Image
          source={require("../../assets/Logo_kristek_apps.png")}
          style={styles.logo}
          resizeMode="cover"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Masuk ke akun Anda</Text>
        <View style={styles.subtitleAccent} />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={[styles.input, usernameFocused && styles.inputFocused]}
          placeholder="Masukkan username"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          onFocus={() => setUsernameFocused(true)}
          onBlur={() => setUsernameFocused(false)}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              passwordFocused && styles.inputFocused,
            ]}
            placeholder="Masukkan password"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!isPasswordVisible}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsPasswordVisible((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"}
          >
            <Text style={styles.eyeIcon}>👁️</Text>
            {!isPasswordVisible ? <View style={styles.eyeSlash} /> : null}
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[
            styles.button,
            (isSubmitting || !username || !password) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !username || !password}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Masuk</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const KRISTEK_TEAL = "#1B7396";
const KRISTEK_NAVY = "#0B2D5B";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  hero: {
    backgroundColor: KRISTEK_NAVY,
    paddingBottom: 56,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: "center",
  },
  logo: {
    width: 132,
    height: 111,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginTop: -40,
    marginHorizontal: 24,
    padding: 24,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "700",
    color: KRISTEK_NAVY,
    textAlign: "center",
    marginTop: 4,
  },
  subtitleAccent: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: KRISTEK_TEAL,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
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
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: KRISTEK_TEAL,
    backgroundColor: "#fff",
  },
  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    marginBottom: 16,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeIcon: {
    fontSize: 18,
  },
  eyeSlash: {
    position: "absolute",
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#334155",
    transform: [{ rotate: "45deg" }],
  },
  error: {
    color: "#DC2626",
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: KRISTEK_TEAL,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    shadowColor: KRISTEK_TEAL,
    shadowOpacity: 0.3,
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
    letterSpacing: 0.3,
  },
});
