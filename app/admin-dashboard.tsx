// admin-dashboard.tsx
import { Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "./context/AuthContext";

type MenuKey = "inicio" | "reporte-habitaciones" | "reporte-limpieza" | "inventario-diario" | "inventario-semanal";

export default function AdminDashboard() {
  const { user, setUser } = useAuth();
  const [menu, setMenu] = useState<MenuKey>("inicio");

  // si no hay sesión, mandar a login
  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        <Sidebar active={menu} onChange={setMenu} onLogout={handleLogout} user={user} />
        <View style={styles.content}>
          <Header user={user} />
          <ScrollView contentContainerStyle={{ padding: 18 }}>
            {menu === "inicio" && <Inicio />}
            {menu === "reporte-habitaciones" && <ReporteHabitaciones />}
            {menu === "reporte-limpieza" && <ReporteLimpieza />}
            {menu === "inventario-diario" && <Inventario tipo="diario" />}
            {menu === "inventario-semanal" && <Inventario tipo="semanal" />}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------- Sidebar ---------- */
function Sidebar({ active, onChange, onLogout, user }: { active: MenuKey; onChange: (k: MenuKey) => void; onLogout: () => void; user: string | null }) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.brandCircle}>
          <Text style={styles.brandInitial}>H</Text>
        </View>
        <Text style={styles.brandText}>HotelMan</Text>
      </View>

      <TouchableOpacity style={[styles.menuItem, active === "inicio" && styles.menuItemActive]} onPress={() => onChange("inicio")}>
        <MaterialIcons name="dashboard" size={20} />
        <Text style={styles.menuLabel}>Inicio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuItem, active === "reporte-habitaciones" && styles.menuItemActive]} onPress={() => onChange("reporte-habitaciones")}>
        <FontAwesome5 name="bed" size={18} />
        <Text style={styles.menuLabel}>Reporte de habitaciones</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuItem, active === "reporte-limpieza" && styles.menuItemActive]} onPress={() => onChange("reporte-limpieza")}>
        <Feather name="filter" size={18} />
        <Text style={styles.menuLabel}>Reporte de Limpieza</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuItem, active === "inventario-diario" && styles.menuItemActive]} onPress={() => onChange("inventario-diario")}>
        <MaterialIcons name="inventory" size={18} />
        <Text style={styles.menuLabel}>Inventario diario</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuItem, active === "inventario-semanal" && styles.menuItemActive]} onPress={() => onChange("inventario-semanal")}>
        <MaterialIcons name="date-range" size={18} />
        <Text style={styles.menuLabel}>Inventario semanal</Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <MaterialIcons name="logout" size={18} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- Header ---------- */
function Header({ user }: { user: string | null }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Dashboard</Text>
      <View style={styles.headerRight}>
        <View style={styles.userBox}>
          <Text style={styles.userName}>{user ?? "Admin"}</Text>
        </View>
      </View>
    </View>
  );
}

/* ---------- Secciones ---------- */
function Inicio() {
  // tarjetas simples
  const stats = [
    { label: "Arrivals (sem)", value: 54 },
    { label: "Departures (sem)", value: 12 },
    { label: "Rooms occupied", value: 50, pct: 80 },
  ];

  return (
    <View>
      <View style={styles.cardsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.card}>
            <Text style={styles.cardLabel}>{s.label}</Text>
            <Text style={styles.cardValue}>{s.value}</Text>
            {"pct" in s && <View style={styles.cardBadge}><Text style={styles.cardBadgeText}>{s.pct}%</Text></View>}
          </View>
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.sectionTitle}>Reservaciones recientes</Text>
        <FlatList
          data={[
            { id: "#1245", guest: "Mariska Venus", room: "2B", date: "Jul 31, 2019" },
            { id: "#1246", guest: "Juan Perez", room: "1A", date: "Aug 02, 2019" },
            { id: "#1247", guest: "Ana Gomez", room: "3C", date: "Aug 03, 2019" },
          ]}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.reservationRow}>
              <Text style={{ width: 70 }}>{item.id}</Text>
              <Text style={{ flex: 1 }}>{item.guest}</Text>
              <Text style={{ width: 60 }}>{item.room}</Text>
              <Text style={{ width: 110 }}>{item.date}</Text>
            </View>
          )}
        />
      </View>

      <View style={{ marginTop: 18 }}>
        <Text style={styles.sectionTitle}>Weekly Stats (Revenue)</Text>
        <MiniBarChart />
      </View>
    </View>
  );
}

function ReporteHabitaciones() {
  return (
    <View>
      <Text style={styles.sectionTitle}>Reporte de habitaciones</Text>
      <Text style={{ marginTop: 8 }}>Resumen rápido</Text>

      <View style={{ marginTop: 12 }}>
        <View style={styles.reportRow}>
          <Text>Ocupadas</Text>
          <Text style={{ fontWeight: "700" }}>124</Text>
        </View>
        <View style={styles.reportRow}>
          <Text>Disponibles</Text>
          <Text style={{ fontWeight: "700" }}>26</Text>
        </View>
        <View style={styles.reportRow}>
          <Text>Mantenimiento</Text>
          <Text style={{ fontWeight: "700" }}>5</Text>
        </View>
      </View>
    </View>
  );
}

function ReporteLimpieza() {
  // ejemplo de lista
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
          <View style={styles.taskRow}>
            <Text style={{ width: 80 }}>Habitación {item.habitacion}</Text>
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

function Inventario({ tipo }: { tipo: "diario" | "semanal" }) {
  const demo = tipo === "diario" ? [
    { id: "i1", name: "Shampoo", qty: 34 },
    { id: "i2", name: "Jabón", qty: 120 },
  ] : [
    { id: "i1", name: "Shampoo", qty: 210 },
    { id: "i2", name: "Jabón", qty: 840 },
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Inventario {tipo === "diario" ? "diario" : "semanal"}</Text>
      <FlatList
        data={demo}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.inventoryRow}>
            <Text style={{ flex: 1 }}>{item.name}</Text>
            <Text style={{ width: 80, textAlign: "right" }}>{item.qty}</Text>
          </View>
        )}
      />
    </View>
  );
}

/* ---------- Mini chart (sin librerías) ---------- */
function MiniBarChart() {
  const data = [500, 700, 300, 450, 600, 750, 820];
  const max = Math.max(...data);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 140, gap: 8 }}>
      {data.map((v, i) => (
        <View key={i} style={{ alignItems: "center", width: 18, marginRight: 8 }}>
          <View style={[styles.bar, { height: (v / max) * 120 }]} />
          <Text style={{ fontSize: 10, marginTop: 4 }}>{i + 15}</Text>
        </View>
      ))}
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 220,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#e6e6e6",
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
  brand: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  brandCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f3e8ff", alignItems: "center", justifyContent: "center", marginRight: 10 },
  brandInitial: { fontWeight: "700", color: "#8b5cf6" },
  brandText: { fontWeight: "700", fontSize: 16 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, marginBottom: 6 },
  menuItemActive: { backgroundColor: "#f3e8ff" },
  menuLabel: { marginLeft: 12, fontSize: 14 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#002a7f", paddingVertical: 10, borderRadius: 10 },
  logoutText: { color: "#fff", marginLeft: 8 },

  content: { flex: 1, backgroundColor: "#f6f7fb" },
  header: { height: 68, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#eee", backgroundColor: "#fff" },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  userBox: { backgroundColor: "#eef2ff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  userName: { fontWeight: "600" },

  cardsRow: { flexDirection: "row", gap: 12 },
  card: { backgroundColor: "#fff", padding: 14, borderRadius: 12, width: 150, marginRight: 12, position: "relative", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardLabel: { fontSize: 13, color: "#6b7280" },
  cardValue: { fontSize: 22, fontWeight: "700", marginTop: 6 },
  cardBadge: { position: "absolute", right: 8, top: 8, backgroundColor: "#fce7f3", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  cardBadgeText: { fontWeight: "700", fontSize: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },

  reservationRow: { flexDirection: "row", backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 8, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },

  bar: { width: 18, borderRadius: 4, backgroundColor: "#8b5cf6" },

  reportRow: { flexDirection: "row", justifyContent: "space-between", padding: 12, backgroundColor: "#fff", borderRadius: 8, marginBottom: 8 },
  taskRow: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#fff", borderRadius: 8, marginBottom: 8 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6 },

  inventoryRow: { flexDirection: "row", padding: 12, backgroundColor: "#fff", borderRadius: 8, marginBottom: 8, alignItems: "center" },
});
