import { Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";
import { CardsRow, StatCard } from "./components/Cards";
import MiniBarChart from "./components/MiniBarChart";
import MiniLineChart from "./components/MiniLineChart";

type PeriodKey = "7d" | "30d" | "90d";

export default function Inicio() {
  // Colores de acento
  const violet = "#163f75ff"; // llegadas
  const blue = "#D5451B";   // salidas
  const brown = "#6D2932";  // ocupadas

  const stats = [
    { label: "Llegadas (sem)", value: 54, color: violet, icon: <MaterialIcons name="flight-land" size={18} color={violet} /> },
    { label: "Salidas (sem)",  value: 12, color: blue,   icon: <MaterialIcons name="flight-takeoff" size={18} color={blue} /> },
    { label: "Ocupadas",       value: 50, pct: 80, color: brown, icon: <FontAwesome5 name="bed" size={16} color={brown} /> },
  ];

  // -------- Reservaciones (demo) + Refresh real --------
  const [reservations, setReservations] = React.useState([
    { id: "#1245", guest: "Mariska Venus", room: "2B", date: "Jul 31, 2019" },
    { id: "#1246", guest: "Juan Perez",     room: "1A", date: "Aug 02, 2019" },
    { id: "#1247", guest: "Ana Gomez",      room: "3C", date: "Aug 03, 2019" },
  ]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setReservations((prev) => {
        const next = [...prev];
        // rotación simple con cambio de id/fecha
        const first = next.shift()!;
        next.push({
          ...first,
          id: `#${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
        });
        return next;
      });
      setLastUpdated(new Date().toLocaleTimeString());
      setRefreshing(false);
    }, 600);
  };

  // -------- Datos de charts --------
  const baseRevenue = [500, 700, 300, 450, 600, 750, 820]; // 7 días
  const baseOcc = [72, 78, 66, 70, 81, 88, 84];            // 7 días

  const [period, setPeriod] = React.useState<PeriodKey>("7d");

  // Amplía serie base con ligera variación
  const expandSeries = (arr: number[], days: number) =>
    Array.from({ length: days }, (_, i) => {
      const base = arr[i % arr.length];
      const jitter = ((i * 7) % 9) - 4; // -4..+4
      return Math.max(0, Math.round(base + jitter));
    });

  // 7d/30d: puntos diarios; 90d: promedio por bloques de 3 (30 puntos)
  const buildData = React.useCallback((base: number[], p: PeriodKey) => {
    if (p === "7d") {
      return expandSeries(base, 7).map((y, i) => ({ x: i + 1, y }));
    }
    if (p === "30d") {
      return expandSeries(base, 30).map((y, i) => ({ x: i + 1, y }));
    }
    const daily = expandSeries(base, 90);
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < 90; i += 3) {
      const chunk = daily.slice(i, i + 3);
      const avg = Math.round(chunk.reduce((a, b) => a + b, 0) / chunk.length);
      out.push({ x: out.length + 1, y: avg });
    }
    return out;
  }, []);

  const revenueData = React.useMemo(() => buildData(baseRevenue, period), [buildData, period]);
  const occupancyData = React.useMemo(() => buildData(baseOcc, period), [buildData, period]);

  // Altura adaptativa
  const { width } = useWindowDimensions();
  const chartHeight = width >= 1400 ? 420 : width >= 1100 ? 360 : width >= 800 ? 300 : 240;

  const periods: { key: PeriodKey; label: string }[] = [
    { key: "7d", label: "7d" },
    { key: "30d", label: "30d" },
    { key: "90d", label: "90d" },
  ];

  return (
    <View>
      {/* KPI Cards */}
      <CardsRow>
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            pct={("pct" in s ? (s as any).pct : undefined)}
            icon={("icon" in s ? (s as any).icon : undefined)}
            color={("color" in s ? (s as any).color : undefined)}
          />
        ))}
      </CardsRow>

      {/* Reservaciones recientes + botón Actualizar */}
      <View style={{ marginTop: 16 }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reservaciones recientes</Text>

          <Pressable
            onPress={handleRefresh}
            disabled={refreshing}
            style={({ pressed }) => [
              styles.refreshBtn,
              pressed ? { opacity: 0.9 } : null,
              refreshing ? { opacity: 0.7 } : null,
            ]}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#0b3a8a" />
            ) : (
              <Feather name="refresh-ccw" size={16} color="#0b3a8a" />
            )}
            <Text style={styles.refreshText}>
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Text>
          </Pressable>
        </View>

        {lastUpdated && (
          <Text style={styles.updatedText}>Actualizado a las {lastUpdated}</Text>
        )}

        <FlatList
          data={reservations}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          keyExtractor={(i) => i.id}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.duration(220).delay(index * 40)}
              layout={Layout.springify().stiffness(180).damping(18)}
              style={styles.row}
            >
              <View style={styles.dot} />
              <Text style={{ width: 70, fontWeight: "600" }}>{item.id}</Text>
              <Text style={{ flex: 1 }}>{item.guest}</Text>
              <Text style={{ width: 60, textAlign: "center" }}>{item.room}</Text>
              <Text style={{ width: 110, textAlign: "right", color: "#6b7280" }}>
                {item.date}
              </Text>
            </Animated.View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          extraData={`${lastUpdated}-${period}-${reservations.length}`}
        />
      </View>

      {/* Gráficas apiladas + chips de periodo */}
      <View style={{ marginTop: 18 }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Status semanal</Text>

          <View style={styles.chipsRow}>
            {periods.map((p, idx) => {
              const active = p.key === period;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => setPeriod(p.key)}
                  style={[
                    styles.chip,
                    active ? styles.chipActive : null,
                    idx > 0 ? { marginLeft: 8 } : null,
                  ]}
                >
                  <Text style={active ? styles.chipTextActive : styles.chipText}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <MiniBarChart title="Ganancias" data={revenueData} height={chartHeight} />
        <View style={{ height: 12 }} />
        <MiniLineChart
          title="Ocupación de habitaciones (%)"
          data={occupancyData}
          suffixY="%"
          height={chartHeight}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },

  // Botón de actualizar
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6efff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#c7ddff",
  },
  refreshText: { marginLeft: 6, color: "#0b3a8a", fontWeight: "700" },
  updatedText: { color: "#6b7280", fontSize: 12, marginBottom: 6 },

  // Chips de periodo
  chipsRow: { flexDirection: "row", alignItems: "center" },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
  },
  chipActive: { backgroundColor: "#002a7f" },
  chipText: { color: "#1f2937", fontWeight: "600" },
  chipTextActive: { color: "#fff", fontWeight: "700" },

  // Lista
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#160c44ff",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#7c3aed", marginRight: 10 },
});
