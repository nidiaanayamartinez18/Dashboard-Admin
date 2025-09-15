import { Feather, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
// 👇 nuevo import (store)
import { Room as StoreRoom, useRoomsStore } from "@/stores/roomsStore";

/* ── Estatus ─────────────────────────────────────────────────── */
type StatusKey =
  | "dirtyEmpty"
  | "dirtyOccupied"
  | "cleanOccupied"
  | "adjustment"
  | "clean"
  | "blocked"
  | "sold"
  | "lateCheckout";

const STATUS_LIST: { key: StatusKey; label: string; color: string }[] = [
  { key: "dirtyEmpty",    label: "Cuartos vacíos sucios",      color: "#ef4444" },
  { key: "dirtyOccupied", label: "Cuartos ocupados sucios",    color: "#f59e0b" },
  { key: "cleanOccupied", label: "Cuartos ocupados limpios",   color: "#67e8f9" },
  { key: "adjustment",    label: "Cuartos con ajuste",         color: "#34d399" },
  { key: "clean",         label: "Cuartos limpios",            color: "#2563eb" },
  { key: "blocked",       label: "Cuartos bloqueados",         color: "#e879f9" },
  { key: "sold",          label: "Habitaciones vendidas",      color: "#fde047" },
  { key: "lateCheckout",  label: "Habitaciones salida tarde",  color: "#a78bfa" },
];

const STATUS_INDEX: Record<StatusKey, number> = STATUS_LIST.reduce((acc, s, i) => {
  acc[s.key] = i;
  return acc;
}, {} as Record<StatusKey, number>);

/* ── Habitaciones ─────────────────────────────────────────────── */
const ROOMS: Record<"Sencilla" | "Doble" | "Triple" | "Familiar", string[]> = {
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
  Familiar: [
    "101","102","103","104",
    "201","202","203","204",
    "301","302","303","304",
  ],
};

/* ── Fechas ───────────────────────────────────────────────────── */
const esShort = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const esShortMonFirst = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const fmtISO = (d: Date) => d.toISOString().slice(0, 10);

const startOfDay = (d = new Date()) => { const a = new Date(d); a.setHours(0,0,0,0); return a; };
const startOfWeek = (d: Date) => { const a = startOfDay(d); const diff = (a.getDay() + 6) % 7; a.setDate(a.getDate() - diff); return a; };
const addDays = (d: Date, n: number) => { const a = new Date(d); a.setDate(a.getDate() + n); return a; };
const buildRange = (start: Date, len: number) => Array.from({ length: len }, (_, i) => addDays(start, i));
const isBetween = (d: Date, a: Date, b: Date) => startOfDay(d) >= startOfDay(a) && startOfDay(d) <= startOfDay(b);

/* ── Grid ─────────────────────────────────────────────────────── */
type GridMap = Record<string, Record<string, StatusKey>>;

const buildEmptyGrid = (len: number, startDate: Date): GridMap => {
  const days = buildRange(startDate, len).map(fmtISO);
  const map: GridMap = {};
  (Object.keys(ROOMS) as Array<keyof typeof ROOMS>).forEach((k) => {
    ROOMS[k].forEach((room) => {
      map[room] = {};
      days.forEach((iso) => (map[room][iso] = "clean"));
    });
  });
  return map;
};

const seedDemo = (grid: GridMap, len: number, start: Date) => {
  const dates = buildRange(start, len).map(fmtISO);
  const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  Object.values(ROOMS).flat().forEach((room, idx) => {
    if (idx % 17 === 0) grid[room][dates[rnd(0, Math.min(10, len - 1))]] = "blocked";
    const s = rnd(0, Math.max(0, len - 4));
    const span = rnd(1, 4);
    for (let i = 0; i < span; i++) {
      const iso = dates[s + i];
      if (!iso) continue;
      grid[room][iso] = i === 0 ? "sold" : "cleanOccupied";
    }
    dates.filter((_, i) => i % (8 + (idx % 3)) === 0).forEach((iso) => {
      grid[room][iso] = idx % 2 ? "dirtyEmpty" : "dirtyOccupied";
    });
    if (idx % 11 === 0) grid[room][dates[rnd(5, Math.min(12, len - 1))]] = "lateCheckout";
    if (idx % 13 === 0) grid[room][dates[rnd(2, Math.min(9, len - 1))]] = "adjustment";
  });
};

// Mapea Room del store → uno de los 8 StatusKey del reporte
function roomToStatusKey(r: StoreRoom): StatusKey {
  // Prioridades que sobreescriben el estado base
  if (r.status === "blocked") return "blocked";
  if (r.flags?.sold) return "sold";
  if (r.flags?.lateCheckout) return "lateCheckout";
  if (r.flags?.adjustment) return "adjustment";

  // Estado base + ocupación
  if (r.status === "dirty") {
    return r.assignedTo ? "dirtyOccupied" : "dirtyEmpty";
  } else { // r.status === "clean"
    return r.assignedTo ? "cleanOccupied" : "clean";
  }
}


/* ── Calendario emergente (elige semana) ──────────────────────── */
type CalendarProps = {
  top: number;
  right: number;
  visible: boolean;
  selectedStart: Date;
  onPickWeek: (weekStart: Date) => void;
  onClose: () => void;
};

const monthStart = (d: Date) => { const a = new Date(d); a.setDate(1); a.setHours(0,0,0,0); return a; };
const addMonths = (d: Date, n: number) => { const a = new Date(d); a.setMonth(a.getMonth() + n); return a; };

// Matriz 6x7 comenzando en LUNES
const buildCalendarMatrix = (month: Date) => {
  const first = monthStart(month);
  const shift = (first.getDay() + 6) % 7; // lunes=0
  const start = addDays(first, -shift);
  return Array.from({ length: 6 }, (_, r) =>
    Array.from({ length: 7 }, (_, c) => addDays(start, r * 7 + c))
  );
};

function CalendarOverlay({ top, right, visible, selectedStart, onPickWeek, onClose }: CalendarProps) {
  const [viewMonth, setViewMonth] = React.useState<Date>(monthStart(selectedStart));
  const matrix = React.useMemo(() => buildCalendarMatrix(viewMonth), [viewMonth]);
  const selStart = startOfWeek(selectedStart);
  const selEnd = addDays(selStart, 6);

  if (!visible) return null;

  return (
    <>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.calendarWrap, { top, right }]}>
        {/* Header calendario */}
        <View style={styles.calendarHeader}>
          <Pressable onPress={() => setViewMonth(addMonths(viewMonth, -1))} style={styles.navIcon}>
            <Feather name="chevron-left" size={16} color="#0b3a8a" />
          </Pressable>
          <Text style={styles.calendarTitle}>
            {viewMonth.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
          </Text>
          <Pressable onPress={() => setViewMonth(addMonths(viewMonth, +1))} style={styles.navIcon}>
            <Feather name="chevron-right" size={16} color="#0b3a8a" />
          </Pressable>
        </View>

        {/* Días de la semana */}
        <View style={styles.weekRow}>
          {esShortMonFirst.map((d) => (
            <Text key={d} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>

        {/* Celdas */}
        {matrix.map((row, ri) => (
          <View key={ri} style={styles.calRow}>
            {row.map((d, ci) => {
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const inSelectedWeek = isBetween(d, selStart, selEnd);
              return (
                <Pressable
                  key={ci}
                  onPress={() => { onPickWeek(startOfWeek(d)); onClose(); }}
                  style={[
                    styles.calCell,
                    inSelectedWeek ? { backgroundColor: "#e6efff" } : null,
                    !inMonth ? { opacity: 0.45 } : null,
                  ]}
                >
                  <Text style={[styles.calNum, inSelectedWeek ? { fontWeight: "800", color: "#0b3a8a" } : null]}>
                    {d.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </>
  );
}

/* ── Selector de tipo (overlay) ───────────────────────────────── */
type TypeKey = "Todas" | "Sencilla" | "Doble" | "Triple" | "Familiar";

function TypePickerOverlay({
  top,
  right,
  visible,
  activeType,
  onPick,
  onClose,
}: {
  top: number;
  right: number;
  visible: boolean;
  activeType: TypeKey;
  onPick: (t: TypeKey) => void;
  onClose: () => void;
}) {
  if (!visible) return null;

  const TYPES: TypeKey[] = ["Todas", "Sencilla", "Doble", "Triple", "Familiar"];

  return (
    <>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.typeWrap, { top, right }]}>
        <Text style={styles.typeTitle}>Tipo de habitación</Text>
        {TYPES.map((t) => {
          const active = t === activeType;
          return (
            <Pressable
              key={t}
              onPress={() => { onPick(t); onClose(); }}
              style={[
                styles.typeItem,
                active ? { backgroundColor: "#e6efff", borderColor: "#c7ddff" } : null,
              ]}
            >
              <Feather
                name={active ? "check-circle" : "circle"}
                size={16}
                color={active ? "#0b3a8a" : "#9ca3af"}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.typeText, active ? { color: "#0b3a8a", fontWeight: "800" } : null]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

/* ── Pantalla ─────────────────────────────────────────────────── */
export default function ReporteHabitaciones() {
  const { width } = useWindowDimensions();

  // Rango fijo de 14 días (semana + semana)
  const daysLen = 14;

  const [startDate, setStartDate] = React.useState<Date>(startOfWeek(new Date()));
  const [headerBottom, setHeaderBottom] = React.useState(60); // para anclar calendario
  const [filtersBottom, setFiltersBottom] = React.useState(120); // ancla del picker de tipo
  const [showCalendar, setShowCalendar] = React.useState(false);

  const days = React.useMemo(() => buildRange(startDate, daysLen), [startDate]);
  const dayISOs = React.useMemo(() => days.map(fmtISO), [days]);

  const [grid, setGrid] = React.useState<GridMap>(() => {
    const g = buildEmptyGrid(daysLen, startDate);
    seedDemo(g, daysLen, startDate);
    return g;
  });

  const [search, setSearch] = React.useState("");
  const [activeStatuses, setActiveStatuses] = React.useState<StatusKey[]>([]);
  const toggleStatusFilter = (k: StatusKey) =>
    setActiveStatuses((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const goPrevWeek = () => setStart((d) => addDays(d, -7));
  const goNextWeek = () => setStart((d) => addDays(d, +7));
  const goThisWeek = () => setStart(startOfWeek(new Date()));

  function setStart(d: Date | ((cur: Date) => Date)) {
    setStartDate((prev) => {
      const next = typeof d === "function" ? (d as any)(prev) : d;
      const g = buildEmptyGrid(daysLen, next);
      seedDemo(g, daysLen, next);
      setGrid(g);
      return next;
    });
  }

  // 🔎 Estatus dominante por habitación (para el riel)
  const dominantStatus = React.useCallback((room: string): StatusKey => {
    const counts: Partial<Record<StatusKey, number>> = {};
    for (const iso of dayISOs) {
      const k = grid[room][iso];
      counts[k] = (counts[k] ?? 0) + 1;
    }
    let best: StatusKey = "clean";
    let max = -1;
    (Object.keys(counts) as StatusKey[]).forEach((k) => {
      const v = counts[k] ?? 0;
      if (v > max) { max = v; best = k; }
    });
    return best;
  }, [dayISOs, grid]);

  // 🔽 Tipo de habitación (filtro)
  const [activeType, setActiveType] = React.useState<TypeKey>("Todas");
  const [showTypePicker, setShowTypePicker] = React.useState(false);

  // 🟢 Traer habitaciones del store
  const roomsFromStore = useRoomsStore((s) => s.rooms);

  // 🟡 Solo sobreescribe la columna de HOY con el estado real del store
  const todayISO = fmtISO(new Date());
  React.useEffect(() => {
    if (!dayISOs.includes(todayISO)) return; // si hoy no está en el rango, no hacemos nada
    setGrid((prev) => {
      const next: GridMap = { ...prev };
      roomsFromStore.forEach((r) => {
        const roomNumber = r.number;
        if (next[roomNumber]) {
          next[roomNumber] = { ...next[roomNumber], [todayISO]: roomToStatusKey(r) };
        }
      });
      return next;
    });
  }, [roomsFromStore, dayISOs, todayISO]);

  // Medidas
  const LEFT_W = 140;
  const CELL_W = Math.max(48, Math.min(60, Math.floor((width - 260) / 7)));
  const CELL_H = 28;

  const filterRoom = (r: string) => r.toLowerCase().includes(search.trim().toLowerCase());
  const rowMatchesStatus = (room: string) =>
    activeStatuses.length === 0 || dayISOs.some((iso) => activeStatuses.includes(grid[room][iso]));

  return (
    <View style={styles.root}>
      {/* Header */}
      <View
        style={styles.header}
        onLayout={(e) => setHeaderBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
      >
        <View>
          <Text style={styles.title}></Text>
          <Text style={styles.subtitle}>
            {days[0].toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} —{" "}
            {days[days.length - 1].toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable onPress={goThisWeek} style={[styles.btn, { marginRight: 8 }]}>
            <MaterialIcons name="event" size={16} color="#472e07ff" />
            <Text style={styles.btnText}>Semana actual</Text>
          </Pressable>
          <Pressable onPress={goPrevWeek} style={[styles.btn, { marginRight: 8 }]}>
            <Feather name="chevron-left" size={16} color="#472e07ff" />
            <Text style={styles.btnText}>Anterior</Text>
          </Pressable>
          <Pressable onPress={goNextWeek} style={[styles.btn, { marginRight: 8 }]}>
            <Text style={styles.btnText}>Siguiente</Text>
            <Feather name="chevron-right" size={16} color="#472e07ff" />
          </Pressable>

        <Pressable onPress={() => setShowCalendar(true)} style={styles.btn}>
            <MaterialIcons name="date-range" size={16} color="#472e07ff" />
            <Text style={styles.btnText}>Elegir semana</Text>
          </Pressable>
        </View>
      </View>

      {/* Filtros + búsqueda */}
      <View
        style={styles.filtersRow}
        onLayout={(e) => setFiltersBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
      >
        <View style={[styles.searchWrap, { marginRight: 8 }]}>
          <Feather name="search" size={16} color="#6b7280" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar habitación (ej. 106)"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={() => {
            const g = buildEmptyGrid(daysLen, startDate);
            seedDemo(g, daysLen, startDate);
            setGrid(g);
          }}
          style={[styles.smallBtn, { marginRight: 8 }]}
        >
          <MaterialIcons name="bolt" size={14} color="#472e07ff" />
          <Text style={styles.smallBtnText}>Actualizar</Text>
        </Pressable>

        <Pressable onPress={() => setGrid(buildEmptyGrid(daysLen, startDate))} style={[styles.smallBtn, { marginRight: 8 }]}>
          <MaterialIcons name="refresh" size={14} color="#472e07ff" />
          <Text style={styles.smallBtnText}>Limpiar</Text>
        </Pressable>

        {/* Botón de tipo */}
        <Pressable onPress={() => setShowTypePicker(true)} style={styles.smallBtn}>
          <MaterialIcons name="king-bed" size={14} color="#472e07ff" />
          <Text style={styles.smallBtnText}>Tipo: {activeType}</Text>
        </Pressable>
      </View>

      {/* Chips de ESTATUS (filtro) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: "row" }}>
          {STATUS_LIST.map((s, i) => {
            const active = activeStatuses.includes(s.key);
            return (
              <Pressable
                key={s.key}
                onPress={() => toggleStatusFilter(s.key)}
                style={[
                  styles.chip,
                  { borderColor: `${s.color}55`, backgroundColor: active ? `${s.color}22` : "#f3f4f6" },
                  i > 0 ? { marginLeft: 8 } : null,
                ]}
              >
                <View style={[styles.dot, { backgroundColor: s.color, marginRight: 8 }]} />
                <Text style={[styles.chipText, active ? { color: "#0f172a", fontWeight: "800" } : null]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Encabezado de días + Grid por filas */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={{ flexDirection: "row", marginLeft: LEFT_W }}>
            {days.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.dayHead,
                  { width: CELL_W, height: 40, borderRightColor: "#e5e7eb", borderRightWidth: i === days.length - 1 ? 0 : 1 },
                ]}
              >
                <Text style={styles.dayDow}>{esShort[d.getDay()]}</Text>
                <Text style={styles.dayNum}>{d.getDate()}</Text>
              </View>
            ))}
          </View>

          {(Object.keys(ROOMS) as Array<keyof typeof ROOMS>)
            .filter((group) => activeType === "Todas" || group === activeType)
            .map((group, gi) => {
              const rooms = ROOMS[group].filter(filterRoom).filter(rowMatchesStatus);
              if (rooms.length === 0) return null;

              return (
                <Animated.View key={group} entering={FadeInDown.delay(gi * 50)} style={{ flexDirection: "row" }}>
                  {/* Izquierda */}
                  <View style={{ width: LEFT_W }}>
                    <Text style={styles.groupTitle}>{group}</Text>
                    {rooms.map((room) => {
                      const dom = dominantStatus(room);
                      const railColor = STATUS_LIST[STATUS_INDEX[dom]].color;

                      return (
                        <View
                          key={room}
                          style={[
                            styles.roomRow,
                            {
                              height: CELL_H,
                              position: "relative",
                              paddingLeft: 10,
                              borderBottomWidth: 1,
                              borderBottomColor: "#f1f5f9",
                            },
                          ]}
                        >
                          <View style={[styles.rail, { backgroundColor: railColor }]} />
                          <Text style={[styles.roomText, { marginLeft: 6 }]}>#{room}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Derecha (solo visual) */}
                  <View style={{ flex: 1 }}>
                    <View style={{ height: 22 }} />
                    {rooms.map((room) => (
                      <View key={room} style={{ flexDirection: "row" }}>
                        {days.map((d, di) => {
                          const iso = fmtISO(d);
                          const k = grid[room][iso];
                          const c = STATUS_LIST[STATUS_INDEX[k]].color;
                          const dim = activeStatuses.length > 0 && !activeStatuses.includes(k);
                          return (
                            <View
                              key={di}
                              style={[
                                styles.cell,
                                {
                                  width: CELL_W,
                                  height: CELL_H,
                                  backgroundColor: `${c}${dim ? "22" : "CC"}`,
                                  borderRightWidth: di === days.length - 1 ? 0 : 1,
                                  borderRightColor: "#e5e7eb",
                                },
                              ]}
                            />
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </Animated.View>
              );
            })}
        </View>
      </ScrollView>

      {/* Leyenda vertical */}
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: "800", marginBottom: 10 }}>Status</Text>
        <View>
          {STATUS_LIST.map((s) => (
            <View key={s.key} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <View style={[styles.dot, { backgroundColor: s.color, marginRight: 10 }]} />
              <Text>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Overlays */}
      <CalendarOverlay
        visible={showCalendar}
        top={headerBottom + 8}
        right={18}
        selectedStart={startDate}
        onClose={() => setShowCalendar(false)}
        onPickWeek={(weekStart) => setStart(weekStart)}
      />

      <TypePickerOverlay
        visible={showTypePicker}
        top={filtersBottom + 8}
        right={18}
        activeType={activeType}
        onPick={(t) => setActiveType(t)}
        onClose={() => setShowTypePicker(false)}
      />
    </View>
  );
}

/* ── Estilos ─────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, padding: 18, position: "relative" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  headerRight: { flexDirection: "row", alignItems: "center" },

  title: { fontSize: 16, fontWeight: "800" },
  subtitle: { color: "#4b0909ff" , fontSize: 19, fontWeight: "600"},

  btn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F5E7",
    borderColor: "#D7C0AE",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  btnText: { color: "#472e07ff", fontWeight: "800", marginHorizontal: 2 },

  filtersRow: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 10 },
  searchWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f3f4f6", borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  input: { marginLeft: 8, minWidth: 180, paddingVertical: 4, color: "#111827" },

  smallBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F9F5E7", borderColor: "#D7C0AE", borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  smallBtnText: { color: "#472e07ff", fontWeight: "700", marginLeft: 6 },

  dayHead: { alignItems: "center", justifyContent: "center", borderTopWidth: 1, borderTopColor: "#e5e7eb", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  dayDow: { fontSize: 10, color: "#6b7280" },
  dayNum: { fontSize: 14, fontWeight: "800" },

  groupTitle: { fontWeight: "800", marginTop: 4, marginBottom: 4 },
  roomRow: { justifyContent: "center" },
  roomText: { fontWeight: "600" },

  cell: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },

  chip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
  },
  chipText: { color: "#111827", fontWeight: "600" },
  dot: { width: 10, height: 10, borderRadius: 5 },

  // Overlay global (portal)
  overlay: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
    zIndex: 9000,
  },

  /* Calendario */
  calendarWrap: {
    position: "absolute",
    width: 300,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1, borderColor: "#e5e7eb",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
    zIndex: 9100,
    padding: 10,
  },
  calendarHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 8,
  },
  calendarTitle: { fontWeight: "800", color: "#0b3a8a", textTransform: "capitalize" },
  navIcon: { padding: 6, borderRadius: 999, backgroundColor: "#e6efff", borderWidth: 1, borderColor: "#c7ddff" },

  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekday: { flex: 1, textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: "700" },

  calRow: { flexDirection: "row" },
  calCell: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  calNum: { fontSize: 13, color: "#111827" },

  // Riel de color (estatus dominante)
  rail: {
    position: "absolute",
    left: 0,
    top: 4,
    bottom: 4,
    width: 4,
    borderRadius: 2,
  },

  /* Type Picker */
  typeWrap: {
    position: "absolute",
    width: 240,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1, borderColor: "#e5e7eb",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
    zIndex: 9200,
    padding: 10,
  },
  typeTitle: { fontWeight: "800", marginBottom: 8, color: "#0b3a8a" },
  typeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 6,
  },
  typeText: { fontWeight: "600", color: "#111827" },
});
