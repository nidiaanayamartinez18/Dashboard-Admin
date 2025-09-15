import { Feather, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
// ya tienes algo como: import { useRoomsStore } from "@/stores/roomsStore";
import type { Room as StoreRoom } from "@/stores/roomsStore";

const TYPE_ACTIVE_BLUE = "#2563eb"; // azul de realce unificado

/* ====== STORE ====== */
import {
  Room,
  RoomStatus,
  RoomType,
  StatusKey,
  useRoomsStore,
} from "@/stores/roomsStore";

// Demo: fuente de números por tipo (usa la tuya si ya la tienes)
const ROOMS_SOURCE: Record<RoomType, string[]> = {
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

// Genera el arreglo inicial: TODAS limpias (como pediste)
const seedRooms = (): StoreRoom[] => {
  const out: StoreRoom[] = [];
  (Object.keys(ROOMS_SOURCE) as RoomType[]).forEach((t) => {
    ROOMS_SOURCE[t].forEach((n) => {
      out.push({
        id: `${t}-${n}`,
        number: n,
        type: t,
        status: "clean",
        note: undefined,
        assignedTo: undefined,
        flags: {},
      });
    });
  });
  return out;
};

/* ─────────── Util: borde suave desde HEX ─────────── */
const soft = (hex: string, alpha = 0.25) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/* Colores por tipo (para títulos de grupo) */
const TYPE_COLORS: Record<RoomType, string> = {
  Sencilla: "#2563eb",
  Doble: "#16a34a",
  Triple: "#a855f7",
  Familiar: "#f59e0b",
};

/* Metas (para chips principales) */
const STATUS_META_3: Record<
  RoomStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  clean:   { label: "Limpio",    color: "#0a7a36", bg: "#e9fced", border: "#c8f0d3" },
  dirty:   { label: "Sucio",     color: "#d11616", bg: "#fff3e6", border: "#ffe1c2" },
  blocked: { label: "Bloqueado", color: "#8a0b3a", bg: "#ffe6ee", border: "#ffc7d9" },
};

/* Filtros/estatus (8) */
const STATUS_META_8: { key: StatusKey; label: string; color: string }[] = [
  { key: "dirtyEmpty",    label: "Sucio",            color: "#d11616" },
  { key: "dirtyOccupied", label: "Ocupado sucio",    color: "#f59e0b" },
  { key: "cleanOccupied", label: "Ocupado limpio",   color: "#ec1971" },
  { key: "adjustment",    label: "Ajuste",           color: "#2563eb" },
  { key: "clean",         label: "Limpio",           color: "#0a7a36" },
  { key: "blocked",       label: "Bloqueado",        color: "#8a0b3a" },
  { key: "sold",          label: "Reservada",        color: "#fde047" },
  { key: "lateCheckout",  label: "Salida tarde",     color: "#a78bfa" },
];

/* ─────────────────── Modales reutilizables ─────────────────── */
function InputPromptModal({
  visible,
  title,
  initial,
  placeholder,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  initial?: string;
  placeholder?: string;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = React.useState(initial ?? "");
  React.useEffect(() => {
    if (visible) setText(initial ?? "");
  }, [visible, initial]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={styles.centerWrap}>
          <View style={[styles.modalCard, styles.promptCard]}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={placeholder ?? "Escribe aquí..."}
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              autoFocus
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
              <Pressable
                onPress={onClose}
                style={[styles.btn, { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" }]}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </Pressable>
              <View style={{ width: 8 }} />
              <Pressable
                onPress={() => {
                  onSubmit(text.trim());
                  onClose();
                }}
                style={[styles.btn, { backgroundColor: "#e9fced", borderColor: "#c8f0d3" }]}
              >
                <Text style={[styles.btnText, { color: "#0a7a36" }]}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RoomFormModal({
  visible,
  initial,
  onClose,
  onSubmit,
  onDelete,
}: {
  visible: boolean;
  initial?: Room;
  onClose: () => void;
  onSubmit: (data: { number: string; type: RoomType; note?: string }) => void;
  onDelete?: () => void;
}) {
  const [number, setNumber] = React.useState(initial?.number ?? "");
  const [type, setType] = React.useState<RoomType>(initial?.type ?? "Sencilla");
  const [note, setNote] = React.useState<string>(initial?.note ?? "");

  React.useEffect(() => {
    if (visible) {
      setNumber(initial?.number ?? "");
      setType(initial?.type ?? "Sencilla");
      setNote(initial?.note ?? "");
    }
  }, [visible, initial]);

  const isEditing = !!initial;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={styles.centerWrap}>
          <View style={[styles.modalCard, styles.formCard]}>
            <Text style={styles.modalTitle}>{isEditing ? "Editar habitación" : "Agregar habitación"}</Text>

            <View style={{ marginBottom: 10 }}>
              <Text style={styles.inputLabel}>Número</Text>
              <TextInput
                value={number}
                onChangeText={(t) => setNumber(t.replace(/[^\d]/g, ""))}
                keyboardType="number-pad"
                placeholder="Ej. 106"
                placeholderTextColor="#9ca3af"
                style={styles.modalInput}
              />
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={styles.inputLabel}>Tipo</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {(["Sencilla", "Doble", "Triple", "Familiar"] as RoomType[]).map((t, i) => {
                  const active = t === type;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setType(t)}
                      style={[
                        styles.chip,
                        { borderColor: active ? TYPE_COLORS[t] : "#e5e7eb", backgroundColor: active ? `${TYPE_COLORS[t]}1A` : "#f3f4f6" },
                        i > 0 ? { marginLeft: 8 } : null,
                        { marginBottom: 8 },
                      ]}
                    >
                      <Text style={[styles.chipText, active ? { color: TYPE_COLORS[t], fontWeight: "800" } : null]}>
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={styles.inputLabel}>Nota (opcional)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Observaciones, ubicación de llaves, etc."
                placeholderTextColor="#9ca3af"
                style={[styles.modalInput, { height: 84, textAlignVertical: "top" }]}
                multiline
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 6 }}>
              {isEditing && onDelete && (
                <Pressable
                  onPress={onDelete}
                  style={[
                    styles.btn,
                    { backgroundColor: "#ffe6ee", borderColor: "#ffc7d9", marginRight: 8 },
                  ]}
                >
                  <MaterialIcons name="delete" size={16} color="#8a0b3a" />
                  <Text style={[styles.btnText, { color: "#8a0b3a" }]}>Eliminar</Text>
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                style={[styles.btn, { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb", marginRight: 8 }]}
              >
                <MaterialIcons name="close" size={16} color="#111827" />
                <Text style={[styles.btnText, { color: "#111827" }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!number) return Alert.alert("Número requerido", "Ingresa un número de habitación.");
                  onSubmit({ number, type, note: note?.trim() || undefined });
                }}
                style={[styles.btn, { backgroundColor: "#e9fced", borderColor: "#c8f0d3" }]}
              >
                <MaterialIcons name="check-circle" size={16} color="#0a7a36" />
                <Text style={[styles.btnText, { color: "#0a7a36" }]}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─────────────────── Pantalla principal ─────────────────── */
export default function Habitaciones() {
  // Rooms desde el store
  const rooms = useRoomsStore((s) => s.rooms);
  const initRooms = useRoomsStore((s) => s.initRooms);

  // Acciones del store
  const addRoom = useRoomsStore((s) => s.addRoom);
  const updateRoom = useRoomsStore((s) => s.updateRoom);
  const removeRoomStore = useRoomsStore((s) => s.removeRoom);
  const setNoteStore = useRoomsStore((s) => s.setNote);
  const setAssignedToStore = useRoomsStore((s) => s.setAssignedTo);
  const setPrimaryStatus = useRoomsStore((s) => s.setPrimaryStatus);
  const applyStatusKeyStore = useRoomsStore((s) => s.applyStatusKey);

  // al montar, solo si aún no hay rooms en el store
React.useEffect(() => {
  if (rooms.length === 0) {
    initRooms(seedRooms()); // ✅ ahora recibe el arreglo inicial
  }
}, []);

  // Filtros locales
  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<RoomType | "Todos">("Todos");

  /** filtros de 8 estatus (multi-selección) */
  const [statusChips, setStatusChips] = React.useState<StatusKey[]>([]);
  const toggleStatusChip = (k: StatusKey) =>
    setStatusChips((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  // Modales y edición local
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Room | undefined>(undefined);

  const [showPrompt, setShowPrompt] = React.useState(false);
  const [promptTitle, setPromptTitle] = React.useState("");
  const [promptInitial, setPromptInitial] = React.useState("");
  const [promptTarget, setPromptTarget] = React.useState<Room | undefined>(undefined);
  const [promptKind, setPromptKind] = React.useState<"note" | "assign">("note");

  // KPIs (derivados locales)
  const counts3 = rooms.reduce(
    (acc, r) => {
      acc.total += 1;
      acc[r.status] += 1;
      return acc;
    },
    { total: 0, clean: 0, dirty: 0, blocked: 0 } as Record<"total" | RoomStatus, number>
  );
  const STATUS_PREDICATE: Record<StatusKey, (r: Room) => boolean> = {
    dirtyEmpty:    (r) => r.status === "dirty" && !r.assignedTo,
    dirtyOccupied: (r) => r.status === "dirty" && !!r.assignedTo,
    cleanOccupied: (r) => r.status === "clean" && !!r.assignedTo,
    adjustment:    (r) => !!r.flags?.adjustment,
    clean:         (r) => r.status === "clean",
    blocked:       (r) => r.status === "blocked",
    sold:          (r) => !!r.flags?.sold,
    lateCheckout:  (r) => !!r.flags?.lateCheckout,
  };
  const countByKey = (k: StatusKey) => rooms.reduce((n, r) => n + (STATUS_PREDICATE[k](r) ? 1 : 0), 0);
  const kpiDirtyEmpty = countByKey("dirtyEmpty");
  const kpiDirtyOccupied = countByKey("dirtyOccupied");
  const kpiSold = countByKey("sold");
  const kpiCleanOccupied = countByKey("cleanOccupied");
  const kpiAdjustment = countByKey("adjustment");
  const kpiLateCheckout = countByKey("lateCheckout");

  // helpers → ahora delegan al store
  const upsertRoom = (data: { number: string; type: RoomType; note?: string }) => {
    if (editing) {
     updateRoom(editing.id, { number: data.number, type: data.type, note: data.note });
      setEditing(undefined);
    } else {
      addRoom({ number: data.number, type: data.type, note: data.note });
    }
    setShowForm(false);
  };

  const removeRoom = () => {
    if (!editing) return;
    removeRoomStore(editing.id);
    setEditing(undefined);
    setShowForm(false);
  };

  const openNote = (room: Room) => {
    setPromptTarget(room);
    setPromptInitial(room.note ?? "");
    setPromptTitle("Nota");
    setPromptKind("note");
    setShowPrompt(true);
  };

  const openAssign = (room: Room) => {
    setPromptTarget(room);
    setPromptInitial(room.assignedTo ?? "");
    setPromptTitle("Asignar reserva");
    setPromptKind("assign");
    setShowPrompt(true);
  };

  const applyPrompt = (text: string) => {
    if (!promptTarget) return;
    if (promptKind === "note") setNoteStore(promptTarget.id, text || undefined);
    else setAssignedToStore(promptTarget.id, text || undefined);
  };

  // Estados principales (limpio/sucio/bloqueado)
  const setStatus = (room: Room, status: RoomStatus) => {
    setPrimaryStatus(room.id, status);
  };

  // 8 estatus extendidos
  const applyStatusKey = (room: Room, key: StatusKey) => {
    applyStatusKeyStore(room.id, key);
  };

  // Filtrado final
  const filtered = rooms.filter((r) => {
    const matchesType = typeFilter === "Todos" || r.type === typeFilter;
    const matchesStatus =
      statusChips.length === 0 || statusChips.some((k) => STATUS_PREDICATE[k](r));
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      r.number.includes(q) ||
      r.type.toLowerCase().includes(q) ||
      (r.assignedTo ?? "").toLowerCase().includes(q) ||
      (r.note ?? "").toLowerCase().includes(q);
    return matchesType && matchesStatus && matchesQuery;
  });

  const groups: { key: RoomType; rooms: Room[] }[] = (["Sencilla", "Doble", "Triple", "Familiar"] as RoomType[]).map(
    (t) => ({ key: t, rooms: filtered.filter((r) => r.type === t) })
  );

  return (
    <View style={styles.root}>
      {/* ── FILA 1: Buscador + Agregar ── */}
      <View style={[styles.topRow, { alignItems: "center" }]}>
        <View style={[styles.searchWrap, { flex: 1 }]}>
          <Feather name="search" size={16} color="#6b7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por número o nota"
            placeholderTextColor="#9ca3af"
            style={[styles.input, { flex: 1 }]}
          />
        </View>

        <View style={{ width: 8 }} />

        <Pressable
          onPress={() => {
            setEditing(undefined);
            setShowForm(true);
          }}
          style={[styles.btn, { backgroundColor: "#e9fced", borderColor: "#c8f0d3" }]}
        >
          <MaterialIcons name="add" size={16} color="#0a7a36" />
          <Text style={[styles.btnText, { color: "#0a7a36" }]}>Agregar</Text>
        </Pressable>
      </View>

      {/* ── FILA 2: Tipos (centrado) ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={styles.centerRow}>
        <View style={{ flexDirection: "row" }}>
          {(["Todos", "Sencilla", "Doble", "Triple", "Familiar"] as (RoomType | "Todos")[]).map((t, i) => {
            const active = typeFilter === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTypeFilter(t)}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? `${TYPE_ACTIVE_BLUE}66` : "#e5e7eb",
                    backgroundColor: active ? `${TYPE_ACTIVE_BLUE}1A` : "#f3f4f6",
                  },
                  i > 0 ? { marginLeft: 8 } : null,
                ]}
              >
                <MaterialIcons name="hotel" size={14} color={active ? TYPE_ACTIVE_BLUE : "#000000ff"} />
                <Text
                  style={[
                    styles.chipText,
                    {
                      marginLeft: 6,
                      color: active ? TYPE_ACTIVE_BLUE : "#111827",
                      fontWeight: active ? "800" : "600",
                    },
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* ── FILA 3: 8 estatus (centrado) ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={styles.centerRow}>
        <View style={{ flexDirection: "row" }}>
          {STATUS_META_8.map((s, i) => {
            const active = statusChips.includes(s.key);
            return (
              <Pressable
                key={s.key}
                onPress={() => toggleStatusChip(s.key)}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? `${s.color}66` : "#e5e7eb",
                    backgroundColor: active ? `${s.color}22` : "#f3f4f6",
                  },
                  i > 0 ? { marginLeft: 8 } : null,
                ]}
              >
                <View style={[styles.dot, { backgroundColor: s.color, marginRight: 6 }]} />
                <Text style={[styles.chipText, { color: "#111827", fontWeight: active ? "800" : "600" }]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* ── KPIs fila superior (centrados) ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={styles.kpiCenter}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {(["clean", "dirty", "blocked"] as RoomStatus[]).map((st, i) => {
            const m = STATUS_META_3[st];
            return (
              <View
                key={st}
                style={[
                  styles.kpi,
                  { backgroundColor: "#fff", borderColor: soft(m.color, 0.45) },
                  i > 0 ? { marginLeft: 8 } : null,
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={[styles.dot, { backgroundColor: m.color, marginRight: 8 }]} />
                  <Text style={{ color: "#000", fontWeight: "500" }}>{m.label}</Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: "800", marginTop: 6, color: "#0f172a" }}>{counts3[st]}</Text>
              </View>
            );
          })}
          {/* Reservada */}
          <View style={[styles.kpi, { backgroundColor: "#fff", borderColor: soft("#fde047", 0.45) }, { marginLeft: 8 }]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[styles.dot, { backgroundColor: "#fde047", marginRight: 8 }]} />
              <Text style={{ color: "#000", fontWeight: "500" }}>Reservada</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: "800", marginTop: 6, color: "#0f172a" }}>{kpiSold}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── KPIs fila inferior (centrados) ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={styles.kpiCenter}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {[
            { key: "dirtyOccupied" as StatusKey, title: "Ocupado sucio",  color: "#f59e0b",   value: kpiDirtyOccupied },
            { key: "cleanOccupied" as StatusKey, title: "Ocupado limpio", color: "#dd196aff", value: kpiCleanOccupied },
            { key: "adjustment"    as StatusKey, title: "Ajuste",         color: "#2563eb",   value: kpiAdjustment },
            { key: "lateCheckout"  as StatusKey, title: "Salida tarde",   color: "#a78bfa",   value: kpiLateCheckout },
          ].map((item, i) => (
            <View
              key={item.key}
              style={[
                styles.kpi,
                { backgroundColor: "#fff", borderColor: soft(item.color, 0.45) },
                i > 0 ? { marginLeft: 8 } : null,
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={[styles.dot, { backgroundColor: item.color, marginRight: 8 }]} />
                <Text style={{ color: "#000", fontWeight: "500" }}>{item.title}</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: "800", marginTop: 6, color: "#0f172a" }}>{item.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Listado por grupos */}
      <ScrollView>
        {groups.map(({ key, rooms }) => (
          <View key={key} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ width: 6, height: 24, backgroundColor: TYPE_COLORS[key], borderRadius: 999, marginRight: 8 }} />
              <Text style={{ fontWeight: "800" }}>{key}</Text>
            </View>

            {rooms.length === 0 ? (
              <Text style={{ color: "#6b7280", marginLeft: 14 }}>Sin habitaciones</Text>
            ) : (
              <FlatList
                data={rooms}
                keyExtractor={(r) => r.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={{ fontWeight: "800" }}>#{item.number}</Text>
                      <Pressable
                        onPress={() => {
                          setEditing(item);
                          setShowForm(true);
                        }}
                        style={styles.iconBtn}
                      >
                        <Feather name="edit-2" size={14} color="#374151" />
                      </Pressable>
                    </View>
                    <Text style={{ color: "#6b7280" }}>{item.type}</Text>

                    {/* Chips principales */}
                    <View style={styles.roomStatusRow}>
                      {(["clean", "dirty", "blocked"] as RoomStatus[]).map((st, i) => {
                        const m = STATUS_META_3[st];
                        const active = item.status === st;
                        return (
                          <Pressable
                            key={st}
                            onPress={() => setStatus(item, st)}
                            style={[
                              styles.chip,
                              {
                                borderColor: active ? m.border : "#e5e7eb",
                                backgroundColor: active ? m.bg : "#f3f4f6",
                              },
                              i > 0 ? { marginLeft: 8 } : null,
                            ]}
                          >
                            <View style={[styles.dot, { backgroundColor: m.color, marginRight: 6 }]} />
                            <Text style={[styles.chipText, { color: active ? m.color : "#111827", fontWeight: active ? "800" : "600" }]}>
                              {m.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Chips extendidos */}
                    <View style={styles.roomStatusWrap}>
                      {["dirtyOccupied", "cleanOccupied", "adjustment", "sold", "lateCheckout"].map((k) => {
                        const meta = STATUS_META_8.find((x) => x.key === (k as StatusKey))!;
                        const active = STATUS_PREDICATE[k as StatusKey](item);
                        return (
                          <Pressable
                            key={k}
                            onPress={() => applyStatusKey(item, k as StatusKey)}
                            style={[
                              styles.chip,
                              {
                                borderColor: active ? `${meta.color}66` : "#e5e7eb",
                                backgroundColor: active ? `${meta.color}22` : "#f3f4f6",
                              },
                              { marginRight: 8, marginBottom: 8 },
                            ]}
                          >
                            <View style={[styles.dot, { backgroundColor: meta.color, marginRight: 6 }]} />
                            <Text style={[styles.chipText, { color: "#111827", fontWeight: active ? "800" : "600" }]}>{meta.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Acciones */}
                    <View style={styles.actionsRow}>
                      <Pressable onPress={() => openAssign(item)} style={[styles.smallBtn, { marginRight: 8 }]}>
                        <MaterialIcons name="person-add-alt-1" size={14} color="#0b3a8a" />
                        <Text style={[styles.smallBtnText, { color: "#0b3a8a" }]}>Asignar</Text>
                      </Pressable>
                      <Pressable onPress={() => openNote(item)} style={styles.smallBtn}>
                        <MaterialIcons name="sticky-note-2" size={14} color="#6b21a8" />
                        <Text style={[styles.smallBtnText, { color: "#6b21a8" }]}>Nota</Text>
                      </Pressable>
                    </View>

                    {(item.assignedTo || item.note) && (
                      <View style={{ marginTop: 10 }}>
                        {item.assignedTo ? (
                          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                            <MaterialIcons name="person" size={14} color="#0b3a8a" />
                            <Text style={{ marginLeft: 6, color: "#0b3a8a" }}>{item.assignedTo}</Text>
                          </View>
                        ) : null}
                        {item.note ? (
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <MaterialIcons name="notes" size={14} color="#6b21a8" />
                            <Text style={{ marginLeft: 6, color: "#6b21a8" }} numberOfLines={2}>
                              {item.note}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Modales */}
      <RoomFormModal
        visible={showForm}
        initial={editing}
        onClose={() => {
          setEditing(undefined);
          setShowForm(false);
        }}
        onSubmit={upsertRoom}
        onDelete={editing ? removeRoom : undefined}
      />

      <InputPromptModal
        visible={showPrompt}
        title={promptTitle}
        initial={promptInitial}
        placeholder={promptKind === "assign" ? "Nombre del huésped" : "Agrega una nota..."}
        onClose={() => setShowPrompt(false)}
        onSubmit={applyPrompt}
      />
    </View>
  );
}

/* ─────────────────── Estilos (SIN CAMBIOS DE DISEÑO) ─────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, padding: 18, backgroundColor: "#f8fafc" },
  topRow: { flexDirection: "row", marginBottom: 12 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: { marginLeft: 8, minWidth: 220, paddingVertical: 4, color: "#111827" },

  actionsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8 },

  roomStatusRow: { flexDirection: "row", justifyContent: "center", marginTop: 10 },

  roomStatusWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignContent: "center",
    marginTop: 8,
  },

  kpiCenter: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  centerRow: { flexGrow: 1, justifyContent: "center", alignItems: "center" },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { color: "#111827" },
  dot: { width: 10, height: 10, borderRadius: 5 },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  btnText: { marginLeft: 6, fontWeight: "700" },

  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderColor: "#c7ddff",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  smallBtnText: { marginLeft: 6, fontWeight: "700" },

  kpi: { width: 160, padding: 12, borderRadius: 12, borderWidth: 2 },

  card: {
    width: 330,
    padding: 14,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },

  /* Modales centrados */
  modalRoot: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.1)" },
  centerWrap: { width: "100%", alignItems: "center", paddingHorizontal: 18 },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    padding: 12,
  },
  modalTitle: { fontWeight: "800", marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    color: "#111827",
  },
  promptCard: { width: "90%", maxWidth: 520, alignSelf: "center" },
  formCard: { width: "96%", maxWidth: 640, alignSelf: "center" },
  inputLabel: { marginBottom: 6, color: "#374151", fontWeight: "700" },
});
