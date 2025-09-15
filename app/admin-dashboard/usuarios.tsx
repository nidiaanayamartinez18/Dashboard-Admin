import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function Usuarios() {
  const data = [
    { id: "u1", name: "Mariska Venus", role: "Recepción" },
    { id: "u2", name: "Juan Pérez", role: "Limpieza" },
    { id: "u3", name: "Ana Gómez", role: "Gerencia" },
  ];
  return (
    <View style={{ padding: 18 }}>
      <Text style={styles.title}>Usuarios</Text>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ flex: 1, fontWeight: "600" }}>{item.name}</Text>
            <Text style={{ color: "#6b7280" }}>{item.role}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
});
