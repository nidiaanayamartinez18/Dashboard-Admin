import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle, G, Path, Line as SvgLine } from "react-native-svg";

/* Altura uniforme para los 4 bloques */
const CARD_H = 240;

/* ───────────── Demo data ───────────── */
const pesos = (n: number) => `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

const today = new Date();
const mm = (d: Date) => d.toLocaleDateString("es-MX", { month: "short" }).replace(".", "");
const monthsLabels = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
  return mm(d);
});
const revenue12 = [32800, 21450, 18780, 25120, 19800, 30110, 28790, 32010, 25980, 27950, 35120, 38940];
const guests7 = [320, 610, 480, 730, 560, 620, 940];

/* Ingresos (7 días) */
const revenue7 = [29205, 28410, 27380, 28850, 30110, 31240, 32980];
const days7 = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/* ─────────── Ocupación (52 habitaciones con desglose) ─────────── */
const OCC = {
  rooms: 52,
  occupied: 37,
  reserved: 6,
  available: 7,
  notReady: 2,
};
const occPct = Math.round((OCC.occupied / OCC.rooms) * 100);

/* ───────────── Helpers & charts ───────────── */
function areaPath(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }
  return d;
}
const maxOf = (a: number[]) => Math.max(...a, 1);
const minOf = (a: number[]) => Math.min(...a, 0);

function LineChart({
  data,
  labels,
  width,
  height = 200,
  color = "#2563eb",
  showGrid = true,
  formatValue,
}: {
  data: number[];
  labels?: string[];
  width: number;
  height?: number;
  color?: string;
  showGrid?: boolean;
  /** Formateador para el valor del tooltip (opcional) */
  formatValue?: (n: number) => string;
}) {
  const padL = 34, padR = 10, padT = 10, padB = 24;
  const w = width - padL - padR;
  const h = height - padT - padB;
  const max = maxOf(data), min = minOf(data);
  const xStep = data.length > 1 ? w / (data.length - 1) : 0;

  const points = data.map((v, i) => ({
    x: padL + i * xStep,
    y: padT + h - ((v - min) / (max - min || 1)) * h,
  }));
  const d = areaPath(points);

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => min + ((max - min) * i) / yTicks);

  /* ⇢ Punto activo (toggle: tocar mismo punto lo oculta) */
  const [sel, setSel] = React.useState<number | null>(null);
  const nearestIndexFromX = (lx: number) => {
    const clamped = Math.max(padL, Math.min(width - padR, lx));
    const t = (clamped - padL) / (w || 1);
    return Math.round(t * (data.length - 1));
  };

  const labelOf = (i: number) => (labels && labels[i] ? labels[i] : `#${i + 1}`);
  const valueOf = (i: number) =>
    formatValue ? formatValue(data[i]) : data[i].toLocaleString("es-MX", { maximumFractionDigits: 0 });

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  return (
    <View
      style={{ width, height }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        const idx = nearestIndexFromX(e.nativeEvent.locationX);
        setSel((cur) => (cur === idx ? null : idx)); // toggle al tocar el mismo
      }}
      onResponderMove={(e) => setSel(nearestIndexFromX(e.nativeEvent.locationX))}
    >
      <Svg width={width} height={height}>
        {showGrid &&
          ticks.map((t, i) => {
            const y = padT + h - ((t - min) / (max - min || 1)) * h;
            return <SvgLine key={i} x1={padL} x2={width - padR} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={1} />;
          })}
        <Path d={`${d} L ${padL + w} ${padT + h} L ${padL} ${padT + h} Z`} fill={color + "22"} />
        <Path d={d} stroke={color} strokeWidth={2} fill="none" />

        {/* puntos */}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={sel === i ? 5 : 3} fill={sel === i ? color : (color + "66")} />
        ))}

        {/* guía vertical del punto activo */}
        {sel != null && (
          <SvgLine
            x1={points[sel].x}
            x2={points[sel].x}
            y1={padT}
            y2={padT + h}
            stroke="#94a3b8"
            strokeDasharray="4 6"
          />
        )}
      </Svg>

      {/* etiquetas Y */}
      <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: padL - 4 }} pointerEvents="none">
        {ticks.map((t, i) => {
          const y = padT + h - ((t - min) / (max - min || 1)) * h;
          return (
            <Text key={i} style={[styles.yLabel, { position: "absolute", right: 2, top: y - 7 }]}>
              {Math.round(t).toLocaleString("es-MX")}
            </Text>
          );
        })}
      </View>

      {/* etiquetas X */}
      {labels && (
        <View style={{ position: "absolute", left: padL, right: padR, bottom: 0, height: padB }} pointerEvents="none">
          {labels.map((lb, i) => (
            <Text
              key={i}
              style={[styles.xLabel, { position: "absolute", left: i * xStep - 16, bottom: 2, width: 40, textAlign: "center" }]}
              numberOfLines={1}
            >
              {lb}
            </Text>
          ))}
        </View>
      )}

      {/* Tooltip (con botón para cerrar) */}
      {sel != null && (
        <View
          style={[
            styles.tip,
            {
              left: clamp(points[sel].x - 75, 8, width - 160),
              top: 8,
            },
          ]}
        >
          <Pressable onPress={() => setSel(null)} style={styles.tipClose}>
            <Feather name="x" size={14} color="#64748b" />
          </Pressable>
          <Text style={styles.tipTitle}>{labelOf(sel)}</Text>
          <View style={styles.tipRow}>
            <View style={[styles.tipDot, { backgroundColor: color }]} />
            <Text style={styles.tipValue}>{valueOf(sel)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* Dona multisegmento*/
function SegDonut({
  segments,
  size = 160,
  stroke = 16,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;

  // Usar el total de los segmentos para repartir todo el anillo
  const total = Math.max(segments.reduce((n, s) => n + s.value, 0), 1);

  let acc = 0; // acumulado de proporciones [0..1]
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Fondo debajo (no encima) */}
        <Circle cx={cx} cy={cy} r={r} stroke="#eef2f7" strokeWidth={stroke} fill="none" />

        {/* Segmentos: cada uno ocupa su proporción exacta, sin huecos */}
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          {segments.map((seg, idx) => {
            const ratio = seg.value / total;
            const start = acc;                // inicio del segmento (0..1)
            const length = idx === segments.length - 1 ? Math.max(0, 1 - acc) : ratio; // el último rellena el resto
            const dash = C * length;
            const gap = C - dash;             // patrón = circunferencia exacta
            const offset = C * (1 - start);   // dónde empieza

            acc += ratio;

            return (
              <Circle
                key={idx}
                cx={cx}
                cy={cy}
                r={r}
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                fill="none"
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}


/* Medidor de ancho para que las gráficas se ajusten al card */
function ChartBlock({ height, children }: { height: number; children: (w: number) => React.ReactNode }) {
  const [w, setW] = React.useState(0);
  return (
    <View
      style={{ width: "100%" }}
      onLayout={(e) => setW(Math.max(0, Math.floor(e.nativeEvent.layout.width)))}
    >
      {w > 0 ? children(w) : null}
      {w === 0 ? <View style={{ height }} /> : null}
    </View>
  );
}

/* ───────────── Main ───────────── */
type PeriodKey = "6m" | "12m";

export default function Inicio() {
  const [period, setPeriod] = React.useState<PeriodKey>("12m");
  const { width } = useWindowDimensions();

  const twoCols = width >= 780;
  const colStyle = twoCols ? styles.colTwo : styles.colOne;

  const revenue = period === "12m" ? revenue12 : revenue12.slice(-6);
  const revLabels = period === "12m" ? monthsLabels : monthsLabels.slice(-6);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 28 }}>
      {/* KPIs */}
      <View style={styles.kpiRow}>
        <KPI icon="dollar-sign" label="Ingresos (mes)" value={pesos(revenue12.slice(-1)[0])} accent="#0ea5e9" />
        <KPI icon="file-plus" label="Nuevas reservas" value="135" accent="#6366f1" />
        <KPI icon="log-in" label="Check-in" value="101" accent="#22c55e" />
        <KPI icon="log-out" label="Check-out" value="29" accent="#f59e0b" />
      </View>

      {/* Grid 2 columnas */}
      <View style={twoCols ? styles.gridTwo : styles.gridOne}>
        {/* Columna A */}
        <View style={colStyle}>
          <Card title="Huéspedes alojados por día">
            <View style={styles.equal}>
              <ChartBlock height={CARD_H - 40}>
                {(w) => (
                  <LineChart
                    data={guests7}
                    labels={days7}
                    width={w}
                    height={CARD_H - 40}
                    color="#6366f1"
                  />
                )}
              </ChartBlock>
            </View>
          </Card>

          {/* Ingresos (7 días) */}
          <Card
            title="Ingresos"
           
          >
            <View style={styles.equal}>
              <ChartBlock height={CARD_H - 56}>
                {(w) => (
                  <LineChart
                    data={revenue7}
                    labels={days7}
                    width={w}
                    height={CARD_H - 56}
                    color="#22c55e"
                    formatValue={pesos}
                  />
                )}
              </ChartBlock>
            </View>
          </Card>
        </View>

        {/* Columna B */}
        <View style={colStyle}>
          <Card title="Ocupación de habitaciones">
            <View style={[styles.equal, { justifyContent: "center" }]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Dona multisegmento llena */}
                <View style={{ position: "relative" }}>
                  <SegDonut
                    segments={[
                      { value: OCC.occupied, color: "#16a34a" }, // Ocupadas
                      { value: OCC.reserved, color: "#2563eb" }, // Reservadas
                      { value: OCC.available, color: "#10b981" }, // Disponibles
                      { value: OCC.notReady, color: "#f97316" },  // No listas
                    ]}
                    size={180}
                    stroke={18}
                  />
                  {/* Texto centrado */}
                  <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontWeight: "800", fontSize: 22, color: "#0f172a" }}>{occPct}%</Text>
                    <Text style={{ color: "#64748b", fontWeight: "700" }}>Ocupadas</Text>
                  </View>
                </View>

                <View style={{ marginLeft: 14, flex: 1 }}>
                  <LegendRow color="#16a34a" label="Ocupadas" value={OCC.occupied} />
                  <LegendRow color="#2563eb" label="Reservadas" value={OCC.reserved} />
                  <LegendRow color="#10b981" label="Disponibles" value={OCC.available} />
                  <LegendRow color="#f97316" label="No listas" value={OCC.notReady} />
                  <View style={{ height: 4 }} />
                  <Text style={{ color: "#64748b", fontWeight: "700" }}>
                    {occPct}% · {OCC.rooms} habitaciones
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          <Card title="Actividad reciente">
            <View style={styles.equal}>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }}>
                {[
                  "Nueva reserva completada · Carla Núñez (Queen)",
                  "Confirmación enviada · José Santos (Doble)",
                  "Pago recibido · Oscar Mondragón (Sencilla)",
                  "Check-out · Hab. 320 — 2 noches",
                ].map((txt, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: i === 0 ? "#22c55e" : "#94a3b8",
                        marginRight: 8,
                      }}
                    />
                    <Text style={{ color: "#334155" }}>{txt}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Card>
        </View>
      </View>

      {/* Booking list al final */}
      <View style={{ marginTop: 8 }}>
        <Card title="Reservaciones">
          <View style={styles.table}>
            <View style={styles.thead}>
              <View style={styles.tr}>
                <Text style={[styles.th, { flex: 1 }]}>Registro</Text>
                <Text style={[styles.th, { flex: 2 }]}>Huésped</Text>
                <Text style={[styles.th, { flex: 1.4 }]}>Tipo de habitación </Text>
                <Text style={[styles.th, { flex: 1 }]}>Noches</Text>
                <Text style={[styles.th, { flex: 1.6 }]}>Check-in</Text>
                <Text style={[styles.th, { flex: 1.6 }]}>Check-out</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Status</Text>
              </View>
            </View>
            {[
              { id: "00123", guest: "James Lisbon", room: "Triple", nights: 3, checkIn: "2024-04-05", checkOut: "2024-04-08", status: "Confirmado" },
              { id: "00124", guest: "María Guzmán", room: "Sencilla", nights: 1, checkIn: "2024-04-06", checkOut: "2024-04-07", status: "Pendiente" },
              { id: "00125", guest: "José Santos", room: "Doble", nights: 2, checkIn: "2024-04-07", checkOut: "2024-04-09", status: "Cancelado" },
            ].map((r) => (
              <View key={r.id} style={styles.tr}>
                <Text style={[styles.td, { flex: 1 }]}>{r.id}</Text>
                <Text style={[styles.td, { flex: 2 }]}>{r.guest}</Text>
                <Text style={[styles.td, { flex: 1.4 }]}>{r.room}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{r.nights}</Text>
                <Text style={[styles.td, { flex: 1.6 }]}>{r.checkIn}</Text>
                <Text style={[styles.td, { flex: 1.6 }]}>{r.checkOut}</Text>
                <Text style={[styles.td, { flex: 1.2 }]}>{r.status}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

/* ───────────── UI bits ───────────── */
function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode; }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View>{right}</View>
      </View>
      {children}
    </View>
  );
}
function KPI({ icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) {
  return (
    <View style={styles.kpi}>
      <View style={[styles.kpiIcon, { backgroundColor: (accent || "#eaf1ff") + "22", borderColor: (accent || "#c7ddff") + "66" }]}>
        <Feather name={icon} size={16} color={accent || "#0b3a8a"} />
      </View>
      <View>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
      </View>
    </View>
  );
}
function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 8 }} />
      <Text style={{ flex: 1 }}>{label}</Text>
      <Text style={{ fontWeight: "800" }}>{value}</Text>
    </View>
  );
}

/* ───────────── Styles ───────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f6f8fb", padding: 18 },

  /* KPIs */
  kpiRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 12 },
  kpi: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minWidth: 210,
    flexGrow: 1,
    marginBottom: 10,
    marginRight: 10,
  },
  kpiIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 10, borderWidth: 1 },
  kpiLabel: { color: "#64748b", fontWeight: "700", fontSize: 14 },
  kpiValue: { color: "#0f172a", fontWeight: "800", fontSize: 18 },

  /* Grid */
  gridOne: { flexDirection: "column" },
  gridTwo: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  colOne: { width: "100%" },
  colTwo: { width: "48.8%", minWidth: 320 },

  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 12, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cardTitle: { fontWeight: "700", color: "#0f172a" , fontSize: 17},

  /* Contenedor de altura fija para los 4 bloques */
  equal: { height: CARD_H },

  /* Chips */
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f3f4f6" },
  chipText: { fontWeight: "800", color: "#111827" },

  /* Tabla */
  table: { width: "100%", backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },
  thead: { backgroundColor: "#eef2f7", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tr: { flexDirection: "row" },
  th: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, fontWeight: "800", color: "#334155" },
  td: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, color: "#0f172a", borderTopWidth: 1, borderTopColor: "#f1f5f9" },

  /* Axis labels */
  yLabel: { color: "#475569", fontSize: 10, textAlign: "right" },
  xLabel: { color: "#475569", fontSize: 10 },

  /* Tooltip */
  tip: {
    position: "absolute",
    width: 160,
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tipTitle: { fontWeight: "800", color: "#0f172a", marginBottom: 6, paddingRight: 18 },
  tipRow: { flexDirection: "row", alignItems: "center" },
  tipDot: { width: 8, height: 8, borderRadius: 999, marginRight: 6 },
  tipValue: { color: "#0f172a", fontWeight: "800" },
  tipClose: { position: "absolute", right: 6, top: 6, padding: 4, borderRadius: 8 },
});
