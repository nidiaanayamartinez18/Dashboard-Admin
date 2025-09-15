import { Slot, router } from "expo-router";
import React, { useEffect } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

export default function AdminDashboardLayout() {
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (!user) router.replace("/");
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.row}>
        <Sidebar onLogout={handleLogout} user={user ?? "Admin"} />
        <View style={styles.content}>
          <Header user={user ?? "Admin"} />
          {/* OJO: objeto plano, nada de arrays aquí */}
          <ScrollView contentContainerStyle={{ padding: 18 }}>
            <Slot />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#f3f4f6" },
  row: { flex: 1, flexDirection: "row" },
  content: { flex: 1, backgroundColor: "#f6f7fb" },
});
