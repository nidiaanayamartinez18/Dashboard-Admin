// app/admin-dashboard/usuarios.tsx
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

/* ================= Tipos y utilidades ================= */

type ResStatus = "Completada" | "Cancelada" | "NoShow" | "En curso";

type Reservation = {
  id: string;
  checkIn: string;   // ISO yyyy-mm-dd
  checkOut: string;  // ISO yyyy-mm-dd
  nights: number;
  rooms: string;     // ej. "201,202"
  total: number;
  status: ResStatus;
};

type RoomType = "Sencilla" | "Doble" | "Triple" | "Familiar";

/** Preferencias: solo tipos de habitación */
type Preferences = {
  roomTypes: RoomType[];
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string; // ISO
  tags: string[];    // usamos "VIP" para el toggle
  preferences: Preferences;
  notes?: string;
  history: Reservation[];
};

const formatea = (n: number) =>
  `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

const daysBetween = (aISO: string, bISO: string) => {
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  return Math.round((b - a) / 86400000);
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/** dd-mmm (minúsculas, con guion: “31-ago”) */
const shortMX = (iso?: string) => {
  if (!iso) return "—";
  const s = new Date(iso)
    .toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
    .replace(".", "")
    .replace(" ", "-");
  return s.toLowerCase();
};

/* ================ Datos demo ================= */

const DEMO: Customer[] = [
  {
    id: "c1",
    name: "María Haydee Guzmán",
    email: "maria.guzman@mail.com",
    phone: "+52 55 5555 1111",
    createdAt: "2025-01-10",
    tags: ["Recurrente"],
    preferences: { roomTypes: ["Doble", "Familiar"] },
    notes: "Prefiere habitación lejos del elevador si el hotel está lleno.",
    history: [
      { id: "r1", checkIn: "2025-03-12", checkOut: "2025-03-14", nights: 2, rooms: "204", total: 3480, status: "Completada" as ResStatus },
      { id: "r2", checkIn: "2025-06-05", checkOut: "2025-06-07", nights: 2, rooms: "201,202", total: 6120, status: "Completada" as ResStatus },
      { id: "r3", checkIn: "2025-09-22", checkOut: "2025-09-24", nights: 2, rooms: "101", total: 2980, status: "En curso" as ResStatus },
    ],
  },
  {
    id: "c2",
    name: "José Gabriel Santos",
    email: "jose.santos@mail.com",
    phone: "+52 33 4444 7777",
    createdAt: "2025-08-02",
    tags: ["VIP"],
    preferences: { roomTypes: ["Sencilla"] },
    notes: "Solicita check-in temprano cuando es posible.",
    history: [
      { id: "r1", checkIn: "2025-08-12", checkOut: "2025-08-15", nights: 3, rooms: "320", total: 7200, status: "Completada" as ResStatus },
      { id: "r2", checkIn: "2025-09-10", checkOut: "2025-09-13", nights: 3, rooms: "318", total: 6780, status: "Completada" as ResStatus },
    ],
  },
  {
    id: "c3",
    name: "Oscar Mondragón",
    email: "oscar.mondragon@mail.com",
    phone: "+52 81 2222 8888",
    createdAt: "2024-11-20",
    tags: [],
    preferences: { roomTypes: ["Triple"] },
    history: [
      { id: "r1", checkIn: "2024-12-05", checkOut: "2024-12-07", nights: 2, rooms: "115", total: 2400, status: "Completada" as ResStatus },
      { id: "r2", checkIn: "2025-01-19", checkOut: "2025-01-20", nights: 1, rooms: "117", total: 1100, status: "Cancelada" as ResStatus },
    ],
  },
  {
    id: "c4",
    name: "Carla Núñez",
    email: "carla.nunez@mail.com",
    phone: "+52 55 9999 0000",
    createdAt: "2025-09-05",
    tags: ["Nuevo"],
    preferences: { roomTypes: ["Sencilla"] },
    history: [
      { id: "r1", checkIn: "2025-09-15", checkOut: "2025-09-16", nights: 1, rooms: "108", total: 980, status: "Completada" as ResStatus },
    ],
  },
];

/* ================ Derivados ================= */

function summarize(c: Customer) {
  const completed = c.history.filter(h => h.status === "Completada");
  const lastEnd = completed.length
    ? completed.map(h => h.checkOut).sort().slice(-1)[0]
    : undefined;
  const totalSpent = completed.reduce((n, r) => n + r.total, 0);
  const totalRes = c.history.length;
  const totalNights = completed.reduce((n, r) => n + r.nights, 0);
  const vip = c.tags.includes("VIP") || totalSpent >= 15000 || totalNights >= 8;
  const recurrent = totalRes >= 3;
  const active90 = !!lastEnd && daysBetween(lastEnd, todayISO()) <= 90;

  return { lastEnd, totalSpent, totalRes, totalNights, vip, recurrent, active90 };
}

/* =================== Pantalla =================== */

export default function Usuarios() {
  const [customers, setCustomers] = React.useState<Customer[]>(DEMO);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"Todos" | "VIP" | "Recurrentes" | "Inactivos">("Todos");
  const [sort, setSort] = React.useState<"Recientes" | "Más reservas" | "A-Z">("Recientes");

  // KPIs
  const totalClientes = customers.length;
  const nuevosMes = customers.filter(c => {
    const d = new Date(c.createdAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const activos90 = customers.filter(c => summarize(c).active90).length;
  const vips = customers.filter(c => summarize(c).vip).length;

  // Filtro + orden
  const filtered = customers
    .filter(c => {
      const q = query.trim().toLowerCase();
      const match =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q));
      if (!match) return false;

      const s = summarize(c);
      if (filter === "VIP") return s.vip;
      if (filter === "Recurrentes") return s.recurrent;
      if (filter === "Inactivos") return !s.active90;
      return true;
    })
    .sort((a, b) => {
      if (sort === "A-Z") return a.name.localeCompare(b.name);
      if (sort === "Más reservas") return summarize(b).totalRes - summarize(a).totalRes;
      const la = summarize(a).lastEnd ?? a.createdAt;
      const lb = summarize(b).lastEnd ?? b.createdAt;
      return la < lb ? 1 : la > lb ? -1 : 0;
    });

  // CSV
  const exportCSV = async () => {
    try {
      const head1 = ["Nombre","Email","Teléfono","VIP","Recurrente","Act. 90d","Reservas","Noches","Gastado","Preferencias"];
      const rows1 = customers.map(c => {
        const s = summarize(c);
        const prefs = c.preferences.roomTypes.join(" / ");
        return [
          c.name, c.email, c.phone,
          s.vip ? "Sí" : "No",
          s.recurrent ? "Sí" : "No",
          s.active90 ? "Sí" : "No",
          s.totalRes, s.totalNights, s.totalSpent, `"${prefs}"`
        ].join(",");
      });

      const head2 = ["Cliente","ResId","Check-in","Check-out","Noches","Habitaciones","Total","Estatus"];
      const rows2 = customers.flatMap(c =>
        c.history.map(h =>
          [c.name, h.id, h.checkIn, h.checkOut, h.nights, h.rooms, h.total, h.status].join(",")
        )
      );

      const csv =
        "Clientes\n" + head1.join(",") + "\n" + rows1.join("\n") +
        "\n\nReservas\n" + head2.join(",") + "\n" + rows2.join("\n");

      const uri = FileSystem.cacheDirectory + `usuarios-${todayISO()}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("CSV generado", "No hay compartir disponible. Se dejó en caché.");
      }
    } catch (e: any) {
      Alert.alert("Error al exportar", e?.message ?? "desconocido");
    }
  };

  // Modal
  const [detail, setDetail] = React.useState<Customer | null>(null);
  const [tab, setTab] = React.useState<"Perfil" | "Historial" | "Observaciones">("Perfil");

  const updateCustomer = (id: string, patch: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
  };

  const toggleRoomPref = (c: Customer, t: RoomType) => {
    const has = c.preferences.roomTypes.includes(t);
    const next = has
      ? c.preferences.roomTypes.filter(x => x !== t)
      : [...c.preferences.roomTypes, t];
    updateCustomer(c.id, { preferences: { roomTypes: next } });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 28 }}>
      {/* HEADER */}
      <View style={styles.header}>
       

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={styles.search}>
            <Feather name="search" size={16} color="#6b7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nombre, email, teléfono o tag"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
            />
          </View>

          <View style={{ width: 8 }} />
          <Pressable onPress={exportCSV} style={[styles.btn, { backgroundColor: "#eef2ff", borderColor: "#c7ddff" }]}>
            <Feather name="download" size={16} color="#0b3a8a" />
            <Text style={[styles.btnText, { color: "#0b3a8a" }]}>Exportar CSV</Text>
          </Pressable>
        </View>
      </View>

      {/* KPIs */}
      <View style={styles.kpiRow}>
        <KPI icon="users" label="Total clientes" value={String(totalClientes)} highlight />
        <KPI icon="user-plus" label="Nuevos este mes" value={String(nuevosMes)} />
        <KPI icon="activity" label="Activos (90 días)" value={String(activos90)} />
        <KPI icon="award" label="VIP" value={String(vips)} />
      </View>

      {/* Filtros */}
      <View style={styles.filtersRow}>
        {(["Todos","VIP","Recurrentes","Inactivos"] as const).map((f, i) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.chip,
                active ? { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" } : null,
                i > 0 ? { marginLeft: 8 } : null,
              ]}
            >
              <Text style={[styles.chipText, active ? { color: "#0a7a36" } : null]}>{f}</Text>
            </Pressable>
          );
        })}

        <View style={{ flex: 1 }} />

        {(["Recientes","Más reservas","A-Z"] as const).map((s, i) => {
          const active = sort === s;
          return (
            <Pressable
              key={s}
              onPress={() => setSort(s)}
              style={[
                styles.chip,
                active ? { backgroundColor: "#eef2ff", borderColor: "#c7ddff" } : null,
                i > 0 ? { marginLeft: 8 } : null,
              ]}
            >
              <Text style={[styles.chipText, active ? { color: "#0b3a8a" } : null]}>{s}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* LISTA — FICHA CON BADGES Y ACCIONES */}
      <View style={{ marginTop: 8 }}>
        {filtered.map((c) => {
          const s = summarize(c);
          const initials = c.name.split(" ").map(p => p[0]).slice(0, 2).join("");

          return (
            <View key={c.id} style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={{ color: "#0b3a8a", fontWeight: "800" }}>{initials}</Text>
                </View>

                {/* Contenido principal */}
                <View style={{ flex: 1 }}>
                  {/* Nombre + badges */}
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.name}>{c.name}</Text>
                    {s.vip ? <Badge text="VIP" color="#16a34a" /> : null}
                    {s.recurrent ? <Badge text="Recurrente" color="#2563eb" /> : null}
                  </View>

                  {/* Pills contacto */}
                  <View style={{ flexDirection: "row", marginTop: 6 }}>
                    <View style={styles.pill}>
                      <Feather name="mail" size={20} color="#0f172a" />
                      <Text style={styles.pillText}>  {c.email}</Text>
                    </View>
                    <View style={{ width: 8 }} />
                    <View style={styles.pill}>
                      <Feather name="phone" size={20} color="#0f172a" />
                      <Text style={styles.pillText}>  {c.phone}</Text>
                    </View>
                  </View>

                  {/* Línea inferior */}
                  <View style={{ flexDirection: "row", marginTop: 8 }}>
                    <Text style={styles.small}><Text style={styles.dimTitle}>Última:</Text> {shortMX(s.lastEnd)}</Text>
                    <View style={{ width: 12 }} />
                    <Text style={styles.small}><Text style={styles.dimTitle}>Reservas:</Text> {s.totalRes}</Text>
                    <View style={{ width: 12 }} />
                    <Text style={styles.small}><Text style={styles.dimTitle}>Gasto:</Text> {formatea(s.totalSpent)}</Text>
                  </View>
                </View>

                {/* Acciones a la derecha */}
                <View style={{ flexDirection: "row", marginLeft: 8 }}>
                  <Pressable
                    onPress={() => { setDetail(c); setTab("Perfil"); }}
                    style={[styles.btn, { backgroundColor: "#fff", borderColor: "#e5e7eb" }]}
                  >
                    <MaterialIcons name="visibility" size={16} color="#111827" />
                    <Text style={[styles.btnText, { color: "#111827" }]}>Ver</Text>
                  </Pressable>

                  <View style={{ width: 8 }} />

                  <Pressable
                    onPress={() =>
                      setCustomers(prev =>
                        prev.map(x =>
                          x.id === c.id
                            ? {
                                ...x,
                                tags: x.tags.includes("VIP")
                                  ? x.tags.filter(t => t !== "VIP")
                                  : [...x.tags, "VIP"],
                              }
                            : x
                        )
                      )
                    }
                    style={[styles.btn, { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" }]}
                  >
                    <MaterialIcons name="grade" size={16} color="#0a7a36" />
                    <Text style={[styles.btnText, { color: "#0a7a36" }]}>
                      {c.tags.includes("VIP") ? "Quitar VIP" : "Marcar VIP"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <Text style={{ color: "#64748b" }}>Sin resultados</Text>
          </View>
        ) : null}
      </View>

      {/* MODAL DETALLE (sin cambios de estructura) */}
      <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.overlay} onPress={() => setDetail(null)} />
          {detail && (
            <View style={styles.modalCard}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Text style={styles.modalTitle}>{detail.name}</Text>
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => setDetail(null)} style={styles.iconGhost}>
                  <MaterialIcons name="close" size={18} color="#475569" />
                </Pressable>
              </View>

              {/* Tabs */}
              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                {(["Perfil","Historial","Observaciones"] as const).map(t => {
                  const active = tab === t;
                  return (
                    <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, active ? styles.tabActive : null]}>
                      <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <ScrollView style={{ maxHeight: 420 }}>
                {tab === "Perfil" && (
                  <View>
                    {/* Contacto */}
                    <Text style={styles.sectionTitle}>Contacto</Text>
                    <View style={styles.grid2}>
                      <LabeledValue icon="mail" label="Email" value={detail.email} />
                      <LabeledValue icon="phone" label="Teléfono" value={detail.phone} />
                    </View>

                    {/* Preferencias: tipos de habitación */}
                    <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Preferencias</Text>
                    <Text style={{ color: "#64748b", fontWeight: "600", marginBottom: 8 }}>
                      Tipo de habitación preferido
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {(["Sencilla","Doble","Triple","Familiar"] as RoomType[]).map((t) => {
                        const active = detail.preferences.roomTypes.includes(t);
                        return (
                          <Pressable
                            key={t}
                            onPress={() =>
                              updateCustomer(detail.id, {
                                preferences: {
                                  roomTypes: active
                                    ? detail.preferences.roomTypes.filter(x => x !== t)
                                    : [...detail.preferences.roomTypes, t],
                                },
                              })
                            }
                            style={[styles.prefChip, active ? styles.prefChipActive : null]}
                          >
                            <MaterialIcons name="hotel" size={14} color={active ? "#0a7a36" : "#111827"} />
                            <Text style={[styles.prefText, { marginLeft: 6 }, active ? styles.prefTextActive : null]}>
                              {t}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {tab === "Historial" && (
                  <View>
                    <View style={styles.table}>
                      <View style={styles.thead}>
                        <View style={styles.tr}>
                          <Text style={[styles.th, { flex: 1.2 }]}>Check-in</Text>
                          <Text style={[styles.th, { flex: 1.2 }]}>Check-out</Text>
                          <Text style={[styles.th, { flex: 0.8 }]}>Noches</Text>
                          <Text style={[styles.th, { flex: 1.6 }]}>Habitaciones</Text>
                          <Text style={[styles.th, { flex: 1.0 }]}>Total</Text>
                          <Text style={[styles.th, { flex: 1.0 }]}>Estatus</Text>
                        </View>
                      </View>
                      {detail.history.map(h => (
                        <View key={h.id} style={styles.tr}>
                          <Text style={[styles.td, { flex: 1.2 }]}>{new Date(h.checkIn).toLocaleDateString("es-MX")}</Text>
                          <Text style={[styles.td, { flex: 1.2 }]}>{new Date(h.checkOut).toLocaleDateString("es-MX")}</Text>
                          <Text style={[styles.td, { flex: 0.8 }]}>{h.nights}</Text>
                          <Text style={[styles.td, { flex: 1.6 }]}>{h.rooms}</Text>
                          <Text style={[styles.td, { flex: 1.0, fontWeight: "700" }]}>{formatea(h.total)}</Text>
                          <Text style={[styles.td, { flex: 1.0 }]}>{h.status}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {tab === "Observaciones" && (
                  <View>
                    <Text style={styles.sectionTitle}>Notas</Text>
                    <TextInput
                      value={detail.notes ?? ""}
                      onChangeText={(t) => updateCustomer(detail.id, { notes: t })}
                      placeholder="Observaciones del cliente, alergias, preferencias específicas, etc."
                      placeholderTextColor="#9ca3af"
                      multiline
                      style={[styles.input, { height: 140, textAlignVertical: "top" }]}
                    />
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

/* =================== Subcomponentes =================== */

function KPI({ icon, label, value, highlight = false }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.kpi, highlight ? { borderColor: "#c7ddff", backgroundColor: "#eef2ff" } : null]}>
      <View style={[styles.kpiIcon, { backgroundColor: highlight ? "#eaf1ff" : "#f3f4f6" }]}>
        <Feather name={icon} size={16} color="#0b3a8a" />
      </View>
      <View>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
      </View>
    </View>
  );
}

function LabeledValue({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.lvRow}>
      <Feather name={icon} size={14} color="#475569" />
      <Text style={styles.lvLabel}> {label}</Text>
      <Text style={styles.lvValue}> {value}</Text>
    </View>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color + "55" }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

/* ========================= Estilos ========================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f6f8fb", padding: 18 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },

  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minWidth: 280,
  },
  searchInput: { marginLeft: 8, paddingVertical: 4, color: "#111827", flex: 1 },

  btn: { flexDirection: "row", alignItems: "center", borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  btnText: { fontWeight: "800", marginLeft: 6 },

  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  kpi: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderColor: "#e5e7eb", borderWidth: 1, borderRadius: 14, padding: 12, minWidth: 200, flexGrow: 1 },
  kpiIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 10 },
  kpiLabel: { color: "#64748b", fontWeight: "700", fontSize: 16},
  kpiValue: { color: "#0f172a", fontWeight: "800", fontSize: 16 },

  filtersRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f3f4f6" },
  chipText: { fontWeight: "800", color: "#111827" },

  /* Card */
  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 12, marginTop: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#eaf1ff", alignItems: "center", justifyContent: "center", marginRight: 10, borderWidth: 1, borderColor: "#c7ddff" },
  name: { fontWeight: "800", color: "#0f172a" },

  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, marginLeft: 8, backgroundColor: "#fff" },
  badgeText: { fontWeight: "800", fontSize: 11 },

  small: { color: "#475569", fontSize: 14 },
  dimTitle: { color: "#64748b", fontWeight: "700" , fontSize: 14},

  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: { color: "#0f172a", fontWeight: "700", fontSize: 14},

  /* Modal */
  modalRoot: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.08)" },
  modalCard: { width: "94%", maxWidth: 920, maxHeight: "90%", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 14 },
  modalTitle: { fontWeight: "800", color: "#0f172a" },
  iconGhost: { padding: 8, borderRadius: 8 },

  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f3f4f6", marginRight: 8 },
  tabActive: { backgroundColor: "#eef2ff", borderColor: "#c7ddff" },
  tabText: { fontWeight: "800", color: "#111827" },
  tabTextActive: { color: "#0b3a8a" },

  sectionTitle: { fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  grid2: { flexDirection: "row", gap: 12 },
  lvRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, flex: 1, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 10 },
  lvLabel: { color: "#64748b", fontWeight: "700" },
  lvValue: { color: "#0f172a", fontWeight: "700" },

  prefChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", marginRight: 8, marginBottom: 8 },
  prefChipActive: { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" },
  prefText: { color: "#111827" },
  prefTextActive: { color: "#0a7a36", fontWeight: "800" },

  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: "#0f172a" },

  /* Tabla */
  table: { width: "100%", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },
  thead: { backgroundColor: "#eef2f7", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tr: { flexDirection: "row" },
  th: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, fontWeight: "800", color: "#334155" },
  td: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, color: "#0f172a", borderTopWidth: 1, borderTopColor: "#f1f5f9" },
});
