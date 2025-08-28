import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "./context/AuthContext";

export default function LoginAdmin() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [showClave, setShowClave] = useState(false);
  const [error, setError] = useState("");
  const { setUser } = useAuth();

  // Animación "float" del logo
  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -5, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [floatY]);

  const handleSubmit = () => {
    if (usuario === "admin" && clave === "1234") {
      // onLoginSuccess(usuario)
      setUser(usuario);
      router.push("/admin-dashboard");
    } else {
      setError("Usuario o clave incorrectos");
    }
  };

  return (
    <LinearGradient colors={["#f5faff", "#eef3ff"]} style={styles.bodyBg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.loginPage}>
          {/* Encabezado */}
          <View style={styles.loginHeader}>
            <Animated.View style={{ transform: [{ translateY: floatY }] }}>
              <LinearGradient colors={["#3b82f6", "#002a7f"]} style={styles.logo}>
                <Image
                  source={require("../assets/logo-admin.png")}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.title}>Panel de Administrador</Text>
            <Text style={styles.subtitle}>Acceso exclusivo</Text>
          </View>

          {/* Formulario */}
          <View style={styles.loginContainer}>
            <View style={styles.loginBox}>
              <View style={styles.form}>
                <Text style={styles.label}>Usuario</Text>
                <TextInput
                  value={usuario}
                  onChangeText={setUsuario}
                  placeholder="Ingrese su usuario"
                  style={styles.inputField}
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Clave</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    value={clave}
                    onChangeText={setClave}
                    placeholder="********"
                    style={styles.inputField}
                    secureTextEntry={!showClave}
                  />
                  <Pressable
                    onPress={() => setShowClave(!showClave)}
                    style={styles.togglePasswordIcon}
                    hitSlop={10}
                  >
                    <Image
                      source={
                        showClave
                          ? require("../assets/eye-open.png")
                          : require("../assets/eye-closed.png")
                      }
                      style={styles.eyeIcon}
                    />
                  </Pressable>
                </View>

                {!!error && <Text style={styles.error}>{error}</Text>}

                <Pressable onPress={handleSubmit} style={{ marginTop: 10 }}>
                  <LinearGradient
                    colors={["#001c45", "#002a7f"]}
                    style={styles.loginButton}
                  >
                    <Text style={styles.loginButtonText}>Ingresar</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bodyBg: { flex: 1 },
  loginPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
  },
  loginHeader: { alignItems: "center", marginBottom: 10 },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 10,
  },
  logoImg: { width: 50, height: 50 },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 16, color: "#3d4046", marginTop: 2 },
  loginContainer: { alignItems: "center", width: "100%" },
  loginBox: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 20,
    width: "90%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 6,
  },
  form: { flexDirection: "column" },
  label: { fontSize: 16, color: "#060e3a", fontWeight: "600" },
  inputField: {
    width: "100%",
    height: 45,
    paddingHorizontal: 12,
    paddingRight: 40, // espacio para el ícono
    marginTop: 7,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    fontSize: 15,
  },
  passwordContainer: { width: "100%", marginBottom: 15, position: "relative" },
  togglePasswordIcon: {
    position: "absolute",
    right: 12,
    top: 6,
    bottom: 15,
    justifyContent: "center",
    height: 45,
  },
  eyeIcon: { width: 20, height: 20},
  error: { color: "red", fontSize: 13, marginTop: 10 },
  loginButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  loginButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});