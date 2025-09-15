import { MaterialIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = { user: string };

const normalize = (p: string) => (p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p);

const TITLES: Record<string, string> = {
  "/admin-dashboard": "Dashboard",
  "/admin-dashboard/index": "Dashboard",
  "/admin-dashboard/reporte-habitaciones": "Reporte de habitaciones",
  "/admin-dashboard/reporte-limpieza": "Reporte de limpieza",
  "/admin-dashboard/inventario-diario": "Corte diario",
  "/admin-dashboard/inventario-semanal": "Corte semanal",
  "/admin-dashboard/usuarios": "Usuarios",
  "/admin-dashboard/promociones": "Promociones",
  "/admin-dashboard/habitaciones": "Habitaciones",
  "/admin-dashboard/perfil": "Perfil",
};

function humanizeFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] ?? "Dashboard";
  return decodeURIComponent(last)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Header({ user }: Props) {
  const pathname = normalize(usePathname() ?? "/");
  const title = TITLES[pathname] ?? humanizeFromPath(pathname);

  const handleProfilePress = () => {
    router.push("/admin-dashboard/perfil");
  };

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>
        <Pressable style={styles.userBtn} onPress={handleProfilePress}>
          <MaterialIcons name="account-circle" size={32} color="#0c3b70ff" />
          <Text style={styles.userName}>{user}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 68,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  // 👇 Sora para títulos
  title: { fontFamily: "Sora_700Bold", fontSize: 20, lineHeight: 24 },
  right: { flexDirection: "row", alignItems: "center" },
  userBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    
  },
  // 👇 Inter para textos de interfaz
  userName: { fontFamily: "Inter_500Medium", marginLeft: 6, color: "#000000ff" , fontSize: 16},
});

