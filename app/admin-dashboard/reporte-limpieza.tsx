import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

export default function ReporteLimpieza() {
  const tareas = [
    { id: "r1", habitacion: "101", estado: "Pendiente" },
    { id: "r2", habitacion: "102", estado: "Completado" },
    { id: "r3", habitacion: "103", estado: "En progreso" },
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Reporte de Limpieza</Text>
      <FlatList
        data={tareas}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ width: 100 }}>Hab. {item.habitacion}</Text>
            <Text style={{ flex: 1 }}>{item.estado}</Text>
            <Pressable style={styles.smallBtn}>
              <Text style={{ color: "#0066ff" }}>Ver</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#fff", borderRadius: 8, marginBottom: 8 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6 },
});
