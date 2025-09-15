import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function InventarioDiario() {
  const data = [
    { id: "i1", name: "Shampoo", qty: 34 },
    { id: "i2", name: "Jabón", qty: 120 },
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Inventario diario</Text>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ flex: 1 }}>{item.name}</Text>
            <Text style={{ width: 80, textAlign: "right" }}>{item.qty}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", padding: 12, backgroundColor: "#fff", borderRadius: 8, marginBottom: 8, alignItems: "center" },
});
