import { Feather, MaterialIcons } from "@expo/vector-icons";
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
import Svg, { Circle } from "react-native-svg";

/* ========= Datos base (tipos y habitaciones) ========= */
type RoomType = "Sencilla" | "Doble" | "Triple" | "Familiar";
type TaskType = "Limpieza" | "Mantenimiento";
type TaskStatus = "Pendiente" | "Proceso" | "Hecho";

const ROOMS: Record<RoomType, string[]> = {
  Sencilla: [
    "106","108","110","112","116","118","120","122",
    "206","208","210","212","216","218","220","222",
    "306","308","310","312","316","318","320","322",
  ],
  Doble: [
    "115","117","119","121","123","124",
    "215","217","219","221","223","224",
    "315","317","319","321","323","324",
  ],
  Triple: [
    "105","107","109","111","113","114",
    "205","207","209","211","213","214",
    "305","307","309","311","313","314",
  ],
  Familiar: ["101","102","103","104","201","202","203","204","301","302","303","304"],
};

const TYPE_COLOR: Record<TaskType, string> = {
  Limpieza: "#0b3a8a",
  Mantenimiento: "#6b21a8",
};

type Task = {
  id: string;
  dateISO: string;        // yyyy-mm-dd
  room: string;
  roomType: RoomType;
  type: TaskType;
  status: TaskStatus;
  assignedTo?: string;
  note?: string;
  flags?: { dirty?: boolean; lateCheckout?: boolean; blocked?: boolean };
};

/* ========= Utilidades de fechas ========= */
const startOfDay = (d = new Date()) => { const a = new Date(d); a.setHours(0,0,0,0); return a; };
const fmtISO = (d: Date) => d.toISOString().slice(0, 10);
const addMonths = (d: Date, n: number) => { const a = new Date(d); a.setMonth(a.getMonth() + n); return a; };
const monthStart = (d: Date) => { const a = new Date(d); a.setDate(1); a.setHours(0,0,0,0); return a; };

/** Matriz 6x7 iniciando en LUNES */
function buildCalendarMatrix(viewMonth: Date) {
  const first = monthStart(viewMonth);
  const shift = (first.getDay() + 6) % 7; // lunes = 0
  const start = new Date(first); start.setDate(first.getDate() - shift);

  return Array.from({ length: 6 }, (_, r) =>
    Array.from({ length: 7 }, (_, c) => {
      const d = new Date(start);
      d.setDate(start.getDate() + r * 7 + c);
      return d;
    })
  );
}

/* ========= Componente ========= */
export default function ReporteLimpieza() {
  const [viewMonth, setViewMonth] = React.useState<Date>(monthStart(new Date()));
  const [selectedDay, setSelectedDay] = React.useState<Date>(startOfDay(new Date()));
  const selectedISO = fmtISO(selectedDay);

  const [tasks, setTasks] = React.useState<Task[]>([]);

  // KPIs del mes visible
  const monthISO = fmtISO(viewMonth).slice(0, 7); // yyyy-mm
  const monthTasks = tasks.filter(t => t.dateISO.startsWith(monthISO));
  const done = monthTasks.filter(t => t.status === "Hecho").length;
  const total = monthTasks.length || 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const dayTasks = tasks.filter(t => t.dateISO === selectedISO);

  // ======= MODAL: Nueva tarea (lista de habitaciones) =======
  const [showModal, setShowModal] = React.useState(false);
  const [newType, setNewType] = React.useState<TaskType>("Limpieza");
  const [newAssigned, setNewAssigned] = React.useState("");
  const [newNote, setNewNote] = React.useState("");
  const [selectedRoom, setSelectedRoom] = React.useState<{ type: RoomType; num: string } | null>(null);

  const resetForm = () => {
    setNewType("Limpieza");
    setNewAssigned("");
    setNewNote("");
    setSelectedRoom(null);
  };

  const createTask = () => {
    if (!selectedRoom) {
      Alert.alert("Falta habitación", "Selecciona una habitación de la lista.");
      return;
    }
    const task: Task = {
      id: Date.now().toString(),
      dateISO: selectedISO,
      room: selectedRoom.num,
      roomType: selectedRoom.type,
      type: newType,
      status: "Pendiente",
      assignedTo: newAssigned?.trim() || undefined,
      note: newNote?.trim() || undefined,
    };
    setTasks(prev => [task, ...prev]);
    setShowModal(false);
    resetForm();
  };

  // ======= Autogeneración del día con reglas finas =======
  const autoGenerateForDay = () => {
    const randPick = <T,>(arr: T[], n: number) => {
      const a = [...arr]; const out: T[] = [];
      while (a.length && out.length < n) out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]);
      return out;
    };

    const pool: { type: RoomType; num: string }[] = (Object.keys(ROOMS) as RoomType[])
      .flatMap(rt => ROOMS[rt].map(num => ({ type: rt, num })));

    const sample = randPick(pool, 8);
    const generated: Task[] = sample
      .filter((_, i) => i % 3 !== 0) // simula excluir bloqueadas
      .map((r, i) => ({
        id: `auto-${selectedISO}-${r.num}`,
        dateISO: selectedISO,
        room: r.num,
        roomType: r.type,
        type: "Limpieza",
        status: i % 5 === 0 ? "Proceso" : "Pendiente",
        flags: { dirty: true, lateCheckout: i % 4 === 0 ? true : false },
      }));

    const already = new Set(dayTasks.map(t => `${t.room}-${t.type}`));
    const toAdd = generated.filter(g => !already.has(`${g.room}-${g.type}`));

    if (toAdd.length === 0) {
      Alert.alert("Nada para generar", "No hay nuevas tareas según las reglas.");
      return;
    }
    setTasks(prev => [...toAdd, ...prev]);
  };

  const matrix = React.useMemo(() => buildCalendarMatrix(viewMonth), [viewMonth]);
  const monthLabel = viewMonth.toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* ===== Encabezado (sin título global) ===== */}
      <View style={styles.header}>
        <View style={styles.monthWrap}>
          <Pressable onPress={() => setViewMonth(m => addMonths(m, -1))} style={styles.iconBtn}>
            <Feather name="chevron-left" size={18} color="#0b3a8a" />
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable onPress={() => setViewMonth(m => addMonths(m, +1))} style={styles.iconBtn}>
            <Feather name="chevron-right" size={18} color="#0b3a8a" />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row" }}>
          <Pressable onPress={autoGenerateForDay} style={[styles.pillBtn, { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" }]}>
            <MaterialIcons name="auto-mode" size={16} color="#0a7a36" />
            <Text style={[styles.pillText, { color: "#0a7a36" }]}>Auto-generar hoy</Text>
          </Pressable>
          <View style={{ width: 8 }} />
          <Pressable onPress={() => setShowModal(true)} style={[styles.pillBtn, { backgroundColor: "#eef2ff", borderColor: "#c7ddff" }]}>
            <MaterialIcons name="add-task" size={16} color="#0b3a8a" />
            <Text style={[styles.pillText, { color: "#0b3a8a" }]}>Agregar tarea</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        {/* ===== Calendario ===== */}
        <View style={styles.calendarCard}>
          <View style={styles.weekHeader}>
            {["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"].map((d) => (
              <Text key={d} style={styles.weekHeadText}>{d}</Text>
            ))}
          </View>

          {matrix.map((row, ri) => (
            <View key={ri} style={styles.calRow}>
              {row.map((d, ci) => {
                const inMonth = d.getMonth() === viewMonth.getMonth();
                const iso = fmtISO(d);
                const dayCount = tasks.filter(t => t.dateISO === iso).length;
                const isSelected = fmtISO(selectedDay) === iso;
                return (
                  <Pressable
                    key={ci}
                    onPress={() => setSelectedDay(startOfDay(d))}
                    style={[
                      styles.dayCell,
                      !inMonth ? { opacity: 0.45 } : null,
                      isSelected ? styles.daySelected : null,
                    ]}
                  >
                    <Text style={styles.dayNum}>{d.getDate()}</Text>
                    {dayCount > 0 ? (
                      <View style={styles.dotBadge}>
                        <Text style={styles.dotText}>{dayCount}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* semana siguiente (fila suave) */}
          <View style={[styles.calRow, { opacity: 0.6 }]}>
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(matrix[5][6]);
              d.setDate(d.getDate() + i + 1);
              return (
                <View key={i} style={[styles.dayCell, { backgroundColor: "#fafafb" }]}>
                  <Text style={[styles.dayNum, { color: "#94a3b8" }]}>{d.getDate()}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ===== Tarjetas laterales (sin “Tareas pendientes (hoy)”) ===== */}
        <View style={styles.sideCol}>
          <View style={styles.sideCard}>
            <Text style={styles.sideTitle}>Estado general</Text>
            <View style={{ alignItems: "center", marginTop: 8 }}>
              <ProgressRing percent={pct} />
              <Text style={{ marginTop: 8, color: "#475569", fontWeight: "700" }}>
                {done}/{total} tareas realizadas
              </Text>
            </View>
          </View>

          <View style={styles.sideCard}>
            <Text style={styles.sideTitle}>Historial semanal</Text>
            <View style={{ height: 80, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: "#94a3b8" }}>Próximamente</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ===== Tableros del día ===== */}
      <View style={styles.kanbanRow}>
        {(["Pendiente","Proceso","Hecho"] as TaskStatus[]).map((col) => {
          const items = dayTasks.filter(t => t.status === col);
          return (
            <View key={col} style={styles.kanbanCol}>
              <View style={styles.colHead}>
                <View style={[styles.stateDot, col === "Pendiente" ? { backgroundColor: "#ef4444" } : col === "Proceso" ? { backgroundColor: "#2563eb" } : { backgroundColor: "#16a34a" }]} />
                <Text style={styles.colTitle}>{col}</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.colCount}>{items.length}</Text>
              </View>

              {items.length === 0 ? (
                <Text style={styles.emptyText}>Sin tareas</Text>
              ) : (
                items.map(t => (
                  <View key={t.id} style={styles.cardItem}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={[styles.todoDot, { backgroundColor: TYPE_COLOR[t.type], marginRight: 8 }]} />
                      <Text style={{ fontWeight: "800", marginRight: 6 }}>#{t.room}</Text>
                      <Text style={{ color: "#64748b" }}>{t.type}</Text>
                    </View>

                    {t.assignedTo ? (
                      <Text style={{ color: "#0b3a8a", marginTop: 4 }}>Asignado: {t.assignedTo}</Text>
                    ) : null}
                    {t.note ? <Text style={{ color: "#6b21a8", marginTop: 2 }}>{t.note}</Text> : null}

                    <View style={{ flexDirection: "row", marginTop: 8 }}>
                      {col !== "Pendiente" && (
                        <Pressable onPress={() => setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: "Pendiente" } : x))} style={styles.smallBtn}>
                          <Text style={styles.smallBtnText}>A pendiente</Text>
                        </Pressable>
                      )}
                      {col !== "Proceso" && (
                        <Pressable onPress={() => setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: "Proceso" } : x))} style={[styles.smallBtn, { marginLeft: 6 }]}>
                          <Text style={styles.smallBtnText}>En proceso</Text>
                        </Pressable>
                      )}
                      {col !== "Hecho" && (
                        <Pressable onPress={() => setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: "Hecho" } : x))} style={[styles.smallBtn, { marginLeft: 6 }]}>
                          <Text style={styles.smallBtnText}>Marcar hecho</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </View>

      {/* ===== MODAL NUEVA TAREA (sin “Fecha”; alto con scroll) ===== */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.overlay} onPress={() => setShowModal(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva tarea</Text>

            {/* Cuerpo con scroll para que siempre se vean los botones */}
            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 8 }}>
              <Text style={styles.label}>Tipo</Text>
              <View style={{ flexDirection: "row" }}>
                {(["Limpieza","Mantenimiento"] as TaskType[]).map((t) => {
                  const active = newType === t;
                  return (
                    <Pressable key={t} onPress={() => setNewType(t)} style={[
                      styles.pillBtn,
                      active ? { backgroundColor: "#eef2ff", borderColor: "#c7ddff" } : { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" },
                      { marginRight: 8 }
                    ]}>
                      <MaterialIcons name={t === "Limpieza" ? "cleaning-services" : "home-repair-service"} size={16} color={active ? "#0b3a8a" : "#6b7280"} />
                      <Text style={[styles.pillText, { color: active ? "#0b3a8a" : "#374151" }]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>Habitación</Text>
              <View style={styles.roomsWrap}>
                <ScrollView style={{ maxHeight: 260 }}>
                  {(Object.keys(ROOMS) as RoomType[]).map(rt => (
                    <View key={rt} style={{ marginBottom: 10 }}>
                      <Text style={styles.groupHead}>{rt}</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {ROOMS[rt].map(num => {
                          const active = selectedRoom?.num === num;
                          return (
                            <Pressable
                              key={num}
                              onPress={() => setSelectedRoom({ type: rt, num })}
                              style={[
                                styles.badge,
                                active ? { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" } : null,
                              ]}
                            >
                              <MaterialIcons name="hotel" size={14} color={active ? "#0a7a36" : "#64748b"} />
                              <Text style={[styles.badgeText, { color: active ? "#0a7a36" : "#0f172a" }]}>#{num}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.label}>Asignado a</Text>
              <TextInput
                value={newAssigned}
                onChangeText={setNewAssigned}
                placeholder="Nombre"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />

              <Text style={styles.label}>Nota</Text>
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder="Observaciones…"
                placeholderTextColor="#9ca3af"
                style={[styles.input, { height: 84, textAlignVertical: "top" }]}
                multiline
              />
            </ScrollView>

            {/* Pie siempre visible */}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
              <Pressable onPress={() => { setShowModal(false); resetForm(); }} style={[styles.pillBtn, { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" }]}>
                <Text style={[styles.pillText, { color: "#111827" }]}>Cancelar</Text>
              </Pressable>
              <View style={{ width: 8 }} />
              <Pressable onPress={createTask} style={[styles.pillBtn, { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" }]}>
                <MaterialIcons name="check-circle" size={16} color="#0a7a36" />
                <Text style={[styles.pillText, { color: "#0a7a36" }]}>Crear</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ========= Ring de progreso ========= */
function ProgressRing({ percent }: { percent: number }) {
  const size = 140;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size/2}
          cy={size/2}
          r={r}
          stroke="#22c55e"
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin={`${size/2}, ${size/2}`}
        />
      </Svg>
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontWeight: "800", color: "#0f172a", fontSize: 18 }}>{percent}%</Text>
        <Text style={{ color: "#64748b", fontWeight: "700" }}>Completado</Text>
      </View>
    </View>
  );
}

/* ========= Estilos ========= */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f6f8fb", padding: 18 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  monthWrap: { flexDirection: "row", alignItems: "center" },
  iconBtn: { padding: 8, borderRadius: 999, backgroundColor: "#eef2ff", borderWidth: 1, borderColor: "#c7ddff" },
  monthLabel: { marginHorizontal: 10, fontWeight: "800", color: "#0f172a", textTransform: "capitalize" },

  grid: { flexDirection: "row", gap: 12 },
  calendarCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 10 },
  weekHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6, paddingHorizontal: 6 },
  weekHeadText: { width: 44, textAlign: "center", color: "#64748b", fontWeight: "700" },

  calRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, paddingHorizontal: 6 },
  dayCell: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: "#f8fafc",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e5e7eb",
  },
  daySelected: { backgroundColor: "#e6f9ed", borderColor: "#c8f0d3" },
  dayNum: { fontWeight: "800", color: "#0f172a" },
  dotBadge: { position: "absolute", right: -6, top: -6, backgroundColor: "#e6efff", borderColor: "#c7ddff", borderWidth: 1, borderRadius: 999, paddingHorizontal: 5, paddingVertical: 2 },
  dotText: { fontSize: 10, color: "#0b3a8a", fontWeight: "800" },

  sideCol: { width: 360, gap: 12 },
  sideCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 12 },
  sideTitle: { fontWeight: "800", color: "#0f172a" },
  emptyText: { color: "#64748b", marginTop: 6 },

  kanbanRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  kanbanCol: { flex: 1, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 12 },
  colHead: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  stateDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  colTitle: { fontWeight: "800", color: "#0f172a" },
  colCount: { backgroundColor: "#f3f4f6", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, color: "#0f172a", fontWeight: "800" },

  cardItem: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 10, marginBottom: 8, backgroundColor: "#ffffff" },
  todoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  todoDot: { width: 8, height: 8, borderRadius: 999, marginRight: 8 },

  pillBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  pillText: { fontWeight: "800", marginLeft: 6 },

  smallBtn: { backgroundColor: "#eef2ff", borderColor: "#c7ddff", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  smallBtnText: { color: "#0b3a8a", fontWeight: "800" },

  /* modal */
  modalRoot: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.08)" },
  modalCard: { width: "92%", maxWidth: 760, maxHeight: "90%", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 14 },
  modalBody: { maxHeight: 440 },
  modalTitle: { fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  label: { color: "#374151", fontWeight: "700", marginBottom: 6 },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: "#0f172a", marginBottom: 8 },

  roomsWrap: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#f8fafc", padding: 8, marginBottom: 10 },
  groupHead: { fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", marginRight: 8, marginBottom: 8 },
  badgeText: { marginLeft: 6, fontWeight: "700" },
});
