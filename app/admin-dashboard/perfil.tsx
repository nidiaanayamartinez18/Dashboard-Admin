import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Perfil() {
  const { user, setUser } = useAuth();

  const handleSave = () => {
    // Aquí podrías guardar los cambios en backend/BD
    alert("Perfil actualizado (ejemplo).");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil de usuario</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Nombre de usuario</Text>
        <TextInput
          style={styles.input}
          value={user ?? ""}
          onChangeText={(txt) => setUser(txt)}
          placeholder="Escribe tu nombre"
        />
      </View>

      <Pressable style={styles.btn} onPress={handleSave}>
        <Text style={styles.btnText}>Guardar cambios</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: "#f6f7fb" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  form: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  btn: {
    backgroundColor: "#002a7f",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
