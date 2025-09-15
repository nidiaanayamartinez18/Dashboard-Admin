import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function Promociones() {
  const promos = [
    { id: "p1", name: "Fin de semana -15%", active: true },
    { id: "p2", name: "Larga estadía -20%", active: false },
  ];
  return (
    <View style={{ padding: 18 }}>
      <Text style={styles.title}>Promociones</Text>
      <FlatList
        data={promos}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ flex: 1, fontWeight: "600" }}>{item.name}</Text>
            <Text style={{ color: item.active ? "#059669" : "#9ca3af" }}>
              {item.active ? "Activa" : "Inactiva"}
            </Text>
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
