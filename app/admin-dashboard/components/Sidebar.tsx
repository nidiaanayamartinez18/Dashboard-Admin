import { Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  onLogout: () => void;
  user: string;
};

const isActivePath = (pathname: string, target: string) => {
  if (target === "/admin-dashboard") {
    return pathname === "/admin-dashboard" || pathname === "/admin-dashboard/";
  }
  return pathname === target;
};

export default function Sidebar({ onLogout, user }: Props) {
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      {/* Brand */}
      <View style={styles.brand}>
        <View style={styles.brandCircle}>
          <Text style={styles.brandInitial}>H</Text>
        </View>
        <Text style={styles.brandText}>HOTEL DIOS PADRE</Text>
      </View>

      {/* INICIO */}
      <Pressable
        onPress={() => router.push("/admin-dashboard")}
        style={[styles.item, isActivePath(pathname, "/admin-dashboard") && styles.active]}
      >
        <MaterialIcons name="dashboard" size={24} color="#1F4172" />
        <Text style={styles.label}>Inicio</Text>
      </Pressable>

      {/* REPORTE HABITACIONES */}
      <Pressable
        onPress={() => router.push("/admin-dashboard/reporte-habitaciones")}
        style={[
          styles.item,
          isActivePath(pathname, "/admin-dashboard/reporte-habitaciones") && styles.active,
        ]}
      >
        <FontAwesome5 name="bed" size={22} color="#1F4172" />
        <Text style={styles.label}>Reporte de habitaciones</Text>
      </Pressable>

      {/* HABITACIONES */}
      <Pressable
        onPress={() => router.push("/admin-dashboard/habitaciones")}
        style={[
          styles.item,
          isActivePath(pathname, "/admin-dashboard/habitaciones") && styles.active,
        ]}
      >
        <MaterialIcons name="king-bed" size={24} color="#1F4172" />
        <Text style={styles.label}>Habitaciones</Text>
      </Pressable>

         {/* CORTE DIARIO */}
      <Pressable
        onPress={() => router.push("/admin-dashboard/inventario-diario")}
        style={[
          styles.item,
          isActivePath(pathname, "/admin-dashboard/inventario-diario") && styles.active,
        ]}
      >
        <MaterialIcons name="inventory" size={24} color="#1F4172" />
        <Text style={styles.label}>Corte diario</Text>
      </Pressable>

      {/* CORTE SEMANAL */}
      <Pressable
        onPress={() => router.push("/admin-dashboard/inventario-semanal")}
        style={[
          styles.item,
          isActivePath(pathname, "/admin-dashboard/inventario-semanal") && styles.active,
        ]}
      >
        <MaterialIcons name="date-range" size={24} color="#1F4172" />
        <Text style={styles.label}>Corte semanal</Text>
      </Pressable>


      {/* REPORTE LIMPIEZA */}
      <Pressable
        onPress={() => router.push("/admin-dashboard/reporte-limpieza")}
        style={[
          styles.item,
          isActivePath(pathname, "/admin-dashboard/reporte-limpieza") && styles.active,
        ]}
      >
        <Feather name="filter" size={24} color="#1F4172" />
        <Text style={styles.label}>Reporte de Limpieza</Text>
      </Pressable>

     
      {/* NUEVO: USUARIOS */}
      <Pressable
        onPress={() => router.push("/admin-dashboard/usuarios")}
        style={[
          styles.item,
          isActivePath(pathname, "/admin-dashboard/usuarios") && styles.active,
        ]}
      >
        <Feather name="users" size={24} color="#1F4172" />
        <Text style={styles.label}>Usuarios</Text>
      </Pressable>

      {/* NUEVO: PROMOCIONES */}
      <Pressable
        onPress={() => router.push("/admin-dashboard/promociones")}
        style={[
          styles.item,
          isActivePath(pathname, "/admin-dashboard/promociones") && styles.active,
        ]}
      >
        <MaterialIcons name="local-offer" size={24} color="#1F4172" />
        <Text style={styles.label}>Promociones</Text>
      </Pressable>      

      <View style={{ flex: 1 }} />

      {/* LOGOUT */}
      <Pressable onPress={onLogout} style={styles.logoutBtn}>
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#e6e6e6ff",
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
  brand: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  brandCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#e2fcf3ff", alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  brandInitial: { fontWeight: "700", color: "#5c66f6ff" },
  brandText: { fontWeight: "700", fontSize: 14 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  active: { backgroundColor: "#e4ecf5ff" },
  label: { marginLeft: 12, fontSize: 14, color: "#111827" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#091a57ff",
    paddingVertical: 10,
    borderRadius: 10,
  },
  logoutText: { color: "#fff", marginLeft: 8, fontWeight: "600" },
});
