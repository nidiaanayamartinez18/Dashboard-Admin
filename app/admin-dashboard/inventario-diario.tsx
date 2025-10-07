import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Alert,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Path, Rect, Line as SvgLine } from "react-native-svg";

/* ──────────────────────────────────────────────
   Datos demo (igual estructura, más métodos de pago)
   ────────────────────────────────────────────── */
type Metodo =
  | "Efectivo"
  | "Débito"
  | "Crédito"
  | "Depósitos"
  | "Transferencias";

type RegistroDia = {
  id: string;
  registro: string;
  nombre: string;
  reserva: string;
  noches: number;
  habitaciones: string;
  adultos: number;
  adicional: number;
  total: number;
  metodo: Metodo;
  facturado: boolean;
  // Nota: si algún día quieres marcar explícitamente
  // una cancelación, puedes añadir `cancelada?: boolean`
  // sin romper nada del render actual.
};

const formatea = (n: number) =>
  `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

const hoyDemoRegistros: RegistroDia[] = [
  { id: "r1", registro: "48961", nombre: "José Gabriel Santos Victoria", reserva: "RCJUN-48", noches: 2, habitaciones: "201,202,202", adultos: 10, adicional: 0, total: 4800, metodo: "Débito", facturado: false },
  { id: "r2", registro: "48962", nombre: "Oscar Mondragón Hernández", reserva: "---------", noches: 3, habitaciones: "101", adultos: 4, adicional: 0, total: 7920, metodo: "Débito", facturado: false },
  { id: "r3", registro: "48963", nombre: "María Guzmán Mendoza", reserva: "---------", noches: 1, habitaciones: "204", adultos: 2, adicional: 0, total: 1528, metodo: "Débito", facturado: false },
  // Extra para que luzcan todas las barras
  { id: "r4", registro: "48964", nombre: "Luis Paredes", reserva: "ABR-221", noches: 1, habitaciones: "105", adultos: 2, adicional: 0, total: 3100, metodo: "Efectivo", facturado: true },
  { id: "r5", registro: "48965", nombre: "Carla Núñez", reserva: "---------", noches: 2, habitaciones: "306", adultos: 3, adicional: 0, total: 4200, metodo: "Crédito", facturado: true },
  { id: "r6", registro: "48966", nombre: "Eduardo Salas", reserva: "MXY-18", noches: 1, habitaciones: "118", adultos: 1, adicional: 0, total: 2600, metodo: "Depósitos", facturado: false },
  { id: "r7", registro: "48967", nombre: "Itzel López", reserva: "---------", noches: 1, habitaciones: "220", adultos: 2, adicional: 0, total: 3850, metodo: "Transferencias", facturado: false },
  { id: "r8", registro: "48968", nombre: "Marco Zepeda", reserva: "---------", noches: 1, habitaciones: "122", adultos: 2, adicional: 0, total: 2980, metodo: "Efectivo", facturado: false },
];

const ingresos14 = [
  5200, 3100, 6400, 9100, 7600, 8400, 6200, 9800, 11200, 9200, 8800, 7600, 6900,
  14248,
];
const DAYS_WINDOW = 7; // o 14 si quieres 14 días

function buildDesglose(registros: RegistroDia[]) {
  const base: Record<Metodo, { noFact: number; fact: number; total: number }> = {
    Efectivo: { noFact: 0, fact: 0, total: 0 },
    Débito: { noFact: 0, fact: 0, total: 0 },
    Crédito: { noFact: 0, fact: 0, total: 0 },
    Depósitos: { noFact: 0, fact: 0, total: 0 },
    Transferencias: { noFact: 0, fact: 0, total: 0 },
  };
  registros.forEach((r) => {
    base[r.metodo].total += r.total;
    if (r.facturado) base[r.metodo].fact += r.total;
    else base[r.metodo].noFact += r.total;
  });
  return base;
}

/* ──────────────────────────────────────────────
   “Nice ticks” para eje Y
   ────────────────────────────────────────────── */
function niceNumber(value: number, round: boolean) {
  const exp = Math.floor(Math.log10(value || 1));
  const f = value / Math.pow(10, exp);
  let nf: number;
  if (round) {
    nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  } else {
    nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  }
  return nf * Math.pow(10, exp);
}
function niceScale(min: number, max: number, tickCount = 5) {
  const range = niceNumber(max - min, false);
  const step = niceNumber(range / (tickCount - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + 0.5 * step; v += step) ticks.push(v);
  return { ticks, min: niceMin, max: niceMax };
}

// ──────────────────────────────────────────────
// Línea de ingresos (solo línea, tooltip persistente con toggle por toque)
// ──────────────────────────────────────────────
const IncomeLineChart = ({
  data,
  width = 520,
  height = 190,
  endDate = new Date(),
}: {
  data: number[];
  width?: number;
  height?: number;
  endDate?: Date;
}) => {
  const padL = 46;
  const padR = 18;
  const padT = 14;
  const padB = 26;
  const w = width - padL - padR;
  const h = height - padT - padB;

  const yInfo = React.useMemo(
    () => niceScale(0, Math.max(...data, 1), 5),
    [data]
  );
  const yToSvg = (v: number) =>
    padT + h - ((v - yInfo.min) / (yInfo.max - yInfo.min || 1)) * h;

  const days = data.length;
  const end = new Date(endDate);
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const xStep = days > 1 ? w / (days - 1) : 0;
  const points = data.map((v, i) => ({
    x: padL + i * xStep,
    y: yToSvg(v),
  }));

  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, "");

  const [selected, setSelected] = React.useState<number | null>(null);

  const nearestIndexFromX = (x: number) => {
    const clamped = Math.max(padL, Math.min(width - padR, x));
    const t = (clamped - padL) / (w || 1);
    return Math.round(t * (days - 1));
  };

  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const idx = nearestIndexFromX(evt.nativeEvent.locationX);
        setSelected((cur) => (cur === idx ? null : idx)); // toggle
      },
      onPanResponderMove: (evt) => {
        const idx = nearestIndexFromX(evt.nativeEvent.locationX);
        setSelected(idx); // arrastrar actualiza
      },
    })
  ).current;

  const xLabels = dates.map((d) =>
    d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
  );
  const showEvery = Math.max(1, Math.ceil(days / 8));

  return (
    <View style={{ width, height }} {...pan.panHandlers}>
      <Svg width={width} height={height}>
        {/* rejilla */}
        {yInfo.ticks.map((t, i) => {
          const y = yToSvg(t);
          return (
            <SvgLine
              key={i}
              x1={padL}
              x2={width - padR}
              y1={y}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          );
        })}
        <SvgLine
          x1={padL}
          x2={width - padR}
          y1={padT + h}
          y2={padT + h}
          stroke="#e5e7eb"
          strokeWidth={1}
        />

        {/* línea */}
        <Path d={linePath} stroke="#2563eb" strokeWidth={2} fill="none" />

        {/* puntos */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={selected === i ? 5 : 3}
            fill={selected === i ? "#2563eb" : "#93c5fd"}
          />
        ))}

        {/* guía/punto activo */}
        {selected != null && (
          <>
            <SvgLine
              x1={points[selected].x}
              x2={points[selected].x}
              y1={padT}
              y2={padT + h}
              stroke="#94a3b8"
              strokeDasharray="4 6"
            />
            <Circle cx={points[selected].x} cy={points[selected].y} r={6} fill="#2563eb" />
          </>
        )}
      </Svg>

      {/* etiquetas Y */}
      <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: padL - 6 }}>
        {yInfo.ticks.map((t, i) => (
          <Text
            key={i}
            style={[styles.yLabel, { position: "absolute", right: 2, top: yToSvg(t) - 7 }]}
          >
            {t.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
          </Text>
        ))}
      </View>

      {/* etiquetas X */}
      <View pointerEvents="none" style={{ position: "absolute", left: padL, right: padR, bottom: 0, height: 26 }}>
        {xLabels.map((lbl, i) => (
          <Text
            key={i}
            style={[
              styles.xLabel,
              { position: "absolute", left: i * (days > 1 ? (w / (days - 1)) : 0) - 16, bottom: 4, width: 40, textAlign: "center" },
              i % showEvery !== 0 ? { opacity: 0 } : null,
            ]}
            numberOfLines={1}
          >
            {lbl}
          </Text>
        ))}
      </View>

      {/* tooltip con botón ✕ */}
      {selected != null && (
        <View
          style={[
            styles.tooltip,
            { left: Math.max(8, Math.min(width - 160, points[selected].x - 70)), top: 8 },
          ]}
        >
          <Pressable style={styles.tipClose} onPress={() => setSelected(null)}>
            <MaterialIcons name="close" size={14} color="#64748b" />
          </Pressable>

          <Text style={styles.tooltipTitle}>
            {dates[selected].toLocaleDateString("es-MX", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </Text>
          <View style={styles.tipRow}>
            <View style={[styles.tipDot, { backgroundColor: "#2563eb" }]} />
            <Text style={styles.tipLabel}>Ingresos</Text>
            <Text style={styles.tipValue}>
              {data[selected].toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

/* ──────────────────────────────────────────────
   Barras: Métodos de pago (sin porcentajes)
   ────────────────────────────────────────────── */
const PaymentBars = ({
  labels,
  values,
  colors,
  width = 420,
  height = 190,
}: {
  labels: string[];
  values: number[];
  colors: string[];
  width?: number;
  height?: number;
}) => {
  const padX = 28;
  const padY = 16;
  const w = width - padX * 2;
  const h = height - padY - 22; // espacio para etiquetas X

  const max = Math.max(...values, 1);
  const n = values.length;
  const gap = 16;
  const barW = (w - gap * (n - 1)) / n;
  const maxIdx = values.indexOf(max);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height - 22}>
        {[0, 1, 2, 3].map((i) => (
          <SvgLine
            key={i}
            x1={padX}
            x2={padX + w}
            y1={padY + (h / 3) * i}
            y2={padY + (h / 3) * i}
            stroke="#eef2f7"
            strokeWidth={1}
          />
        ))}
        {values.map((v, i) => {
          const x = padX + i * (barW + gap);
          const bh = (v / max) * (h - 4);
          const y = padY + (h - 4) - bh;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={bh}
              rx={8}
              fill={colors[i]}
              opacity={i === maxIdx ? 1 : 0.75}
            />
          );
        })}
      </Svg>

      <View style={{ position: "absolute", left: padX, right: padX, bottom: 0, flexDirection: "row" }}>
        {labels.map((t, i) => (
          <View key={t} style={{ width: barW, marginRight: i === n - 1 ? 0 : gap, alignItems: "center" }}>
            <Text style={{ fontSize: 11, color: "#334155" }} numberOfLines={1}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/* ──────────────────────────────────────────────
   Pantalla principal
   ────────────────────────────────────────────── */
export default function InventarioDiario() {
  const [fecha, setFecha] = React.useState(new Date());
  const [busqueda, setBusqueda] = React.useState("");

  const registros = React.useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return hoyDemoRegistros.filter(
      (r) =>
        !q ||
        r.registro.includes(q) ||
        r.nombre.toLowerCase().includes(q) ||
        r.reserva.toLowerCase().includes(q)
    );
  }, [busqueda]);

  const totalDia = registros.reduce((n, r) => n + r.total, 0);
  const reservas = registros.length;

  // ✅ NUEVO KPI: Reservas canceladas (busca "cancel" en el campo reserva o respeta r.cancelada === true)
  const canceladas = registros.filter(
    (r: any) => /cancel/i.test(r.reserva ?? "") || r.cancelada === true
  ).length;

  const desglose = buildDesglose(registros);
  const dOrden: Metodo[] = ["Efectivo", "Débito", "Crédito", "Depósitos", "Transferencias"];
  const barValores = dOrden.map((k) => desglose[k].total);
  const barColores = ["#86efac", "#93c5fd", "#fcd34d", "#a7f3d0", "#d8b4fe"];

  const fechaTexto = fecha.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  const irAyer = () =>
    setFecha((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  const irHoy = () => setFecha(new Date());

  // Util para CSV
  const csvEscape = (val: string | number) => {
    const s = String(val ?? "");
    // escapa comillas dobles y envuelve en comillas
    return `"${s.replace(/"/g, '""')}"`;
  };

  const descargarCSV = async () => {
    // Cabeceras
    const headers1 = [
      "Registro",
      "Nombre del Huésped",
      "Reservación",
      "Noches",
      "Habitaciones",
      "Adultos",
      "Adicional",
      "Total",
      "Método de pago",
      "Facturado",
    ];
    const filas1 = registros.map((r) =>
      [
        r.registro,
        r.nombre,
        r.reserva,
        r.noches,
        r.habitaciones,
        r.adultos,
        r.adicional,
        r.total,
        r.metodo,
        r.facturado ? "Sí" : "No",
      ].map(csvEscape).join(",")
    );

    const headers2 = ["Tipo de pago", "No facturado", "Facturado", "Total"];
    const filas2 = dOrden.map((k) => {
      const d = desglose[k];
      return [k, d.noFact, d.fact, d.total].map(csvEscape).join(",");
    });

    const csv =
      `Inventario diario,${csvEscape(fechaTexto)}\r\n\r\n` +
      headers1.map(csvEscape).join(",") + "\r\n" +
      filas1.join("\r\n") +
      `\r\n\r\n${headers2.map(csvEscape).join(",")}\r\n` +
      filas2.join("\r\n") +
      `\r\n\r\nTOTAL,,,${
        totalDia
      }\r\n`;

    const fileName = `inventario-${fecha.toISOString().slice(0, 10)}.csv`;

    try {
      if (Platform.OS === "web") {
        // Descarga directa en web
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a: any = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert("CSV generado", "La descarga ha comenzado.");
        return;
      }

      // Nativo: escribir y compartir
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Exportar inventario diario",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("CSV listo", `Archivo guardado en: ${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert("No se pudo exportar", e?.message ?? "Error desconocido");
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 28 }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name="event" size={16} color="#64748b" />
            <Text style={styles.subtitle}>  {fechaTexto}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable onPress={irAyer} style={[styles.btn, { marginRight: 8 }]}>
            <Feather name="chevron-left" size={16} color="#0b3a8a" />
            <Text style={styles.btnText}>Anterior</Text>
          </Pressable>
          <Pressable onPress={irHoy} style={[styles.btn, { marginRight: 8 }]}>
            <MaterialIcons name="today" size={16} color="#0b3a8a" />
            <Text style={styles.btnText}>Hoy</Text>
          </Pressable>
          <Pressable onPress={descargarCSV} style={styles.btn}>
            <Feather name="download" size={16} color="#0b3a8a" />
            <Text style={styles.btnText}>Descargar CSV</Text>
          </Pressable>
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.filtersRow}>
        <View style={[styles.searchWrap, { flex: 1 }]}>
          <Feather name="search" size={16} color="#6b7280" />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar en la lista del día"
            placeholderTextColor="#9ca3af"
            style={[styles.input, { flex: 1 }]}
          />
        </View>
      </View>

      {/* KPIs */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: "#e6f9ed" }]}>
            <MaterialIcons name="attach-money" size={18} color="#16a34a" />
          </View>
          <View>
            <Text style={styles.kpiTitle}>Ingresos del día</Text>
            <Text style={styles.kpiValue}>{formatea(totalDia)}</Text>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: "#eaf1ff" }]}>
            <MaterialIcons name="content-copy" size={18} color="#2563eb" />
          </View>
          <View>
            <Text style={styles.kpiTitle}>Reservas activas</Text>
            <Text style={styles.kpiValue}>{reservas}</Text>
          </View>
        </View>

        {/* 🔁 KPI cambiado: "Reservas canceladas" en lugar de "Noches" */}
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: "#efe7ff" }]}>
            <MaterialIcons name="event-busy" size={16} color="#7c3aed" />
          </View>
          <View>
            <Text style={styles.kpiTitle}>Reservas canceladas</Text>
            <Text style={styles.kpiValue}>{canceladas}</Text>
          </View>
        </View>
      </View>

      {/* Gráficas */}
      <View style={styles.chartsRow}>
        <View style={[styles.chartCard, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Ingresos (últimos 14 días)</Text>
          <IncomeLineChart data={ingresos14} width={520} height={190} />
        </View>

        <View style={[styles.chartCard, { width: 420 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Métodos de pago (hoy)</Text>
            {/* (sin botón de exportar) */}
          </View>
          <PaymentBars
            labels={["Efectivo", "Débito", "Crédito", "Depósitos", "Transferencias"]}
            values={barValores}
            colors={barColores}
            width={420}
            height={190}
          />
          <View style={{ marginTop: 8 }}>
            {(["Efectivo", "Débito", "Crédito", "Depósitos", "Transferencias"] as const).map((k, i) => (
              <View key={k} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: barColores[i], marginRight: 8 }} />
                <Text style={{ flex: 1 }}>{k}</Text>
                <Text style={{ fontWeight: "700" }}>{formatea(desglose[k].total)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* TABLAS */}
      <View style={styles.tableBlock}>
        <Text style={styles.blockTitle}>
          Lista del día <Text style={{ color: "#64748b", fontWeight: "600" }}> · {registros.length} registros</Text>
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: 980 }}>
          <View style={styles.table}>
            <View style={styles.thead}>
              <View style={styles.tr}>
                <Text style={[styles.th, { flex: 1.1 }]}>Registro</Text>
                <Text style={[styles.th, { flex: 2.6 }]}>Nombre del Huésped</Text>
                <Text style={[styles.th, { flex: 1.4 }]}>Reservación</Text>
                <Text style={[styles.th, { flex: 0.9 }]}>Noches</Text>
                <Text style={[styles.th, { flex: 1.8 }]}>Habitaciones</Text>
                <Text style={[styles.th, { flex: 0.9 }]}>Adultos</Text>
                <Text style={[styles.th, { flex: 0.9 }]}>Adicional</Text>
                <Text style={[styles.th, { flex: 1.1 }]}>Total</Text>
              </View>
            </View>
            {registros.map((r) => (
              <View key={r.id} style={styles.tr}>
                <Text style={[styles.td, { flex: 1.1 }]}>{r.registro}</Text>
                <Text style={[styles.td, { flex: 2.6 }]}>{r.nombre}</Text>
                <Text style={[styles.td, { flex: 1.4 }]}>{r.reserva}</Text>
                <Text style={[styles.td, { flex: 0.9 }]}>{r.noches}</Text>
                <Text style={[styles.td, { flex: 1.8 }]}>{r.habitaciones}</Text>
                <Text style={[styles.td, { flex: 0.9 }]}>{r.adultos}</Text>
                <Text style={[styles.td, { flex: 0.9 }]}>{r.adicional}</Text>
                <Text style={[styles.td, { flex: 1.1, fontWeight: "700" }]}>{formatea(r.total)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.tableBlock}>
        <Text style={styles.blockTitle}>Desglose de Ingresos Hospedaje</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: 760 }}>
          <View style={styles.table}>
            <View style={styles.thead}>
              <View style={styles.tr}>
                <Text style={[styles.th, { flex: 1.8 }]}>Tipo de pago</Text>
                <Text style={[styles.th, { flex: 1 }]}>No facturado</Text>
                <Text style={[styles.th, { flex: 1 }]}>Facturado</Text>
                <Text style={[styles.th, { flex: 1 }]}>Total</Text>
              </View>
            </View>
            {(["Efectivo", "Débito", "Crédito", "Depósitos", "Transferencias"] as const).map((k) => (
              <View key={k} style={styles.tr}>
                <Text style={[styles.td, { flex: 1.8 }]}>{k}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{formatea(desglose[k].noFact)}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{formatea(desglose[k].fact)}</Text>
                <Text style={[styles.td, { flex: 1, fontWeight: "700" }]}>{formatea(desglose[k].total)}</Text>
              </View>
            ))}
            <View style={[styles.tr, { backgroundColor: "#f8fafc" }]}>
              <Text style={[styles.td, { flex: 1.8, fontWeight: "800" }]}>TOTAL</Text>
              <Text style={[styles.td, { flex: 1 }]} />
              <Text style={[styles.td, { flex: 1 }]} />
              <Text style={[styles.td, { flex: 1, fontWeight: "800" }]}>{formatea(totalDia)}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

/* ──────────────────────────────────────────────
   Estilos
   ────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, padding: 18, backgroundColor: "#f6f8fb" },

  tipClose: { position: "absolute", right: 8, top: 8, padding: 4, borderRadius: 8 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  headerRight: { flexDirection: "row", alignItems: "center" },

  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  subtitle: { color: "#0f172a", fontSize: 14, fontWeight: "600" },

  btn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#e6efff", borderColor: "#c7ddff", borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999,
  },
  btnText: { color: "#0b3a8a", fontWeight: "800", marginLeft: 6 },

  filtersRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 4 },
  searchWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f3f4f6", borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#e5e7eb",
  },
  input: { marginLeft: 8, minWidth: 240, paddingVertical: 4, color: "#111827" },

  /* KPIs */
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8, marginBottom: 12 },
  kpiCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderColor: "#e5e7eb", borderWidth: 1,
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
    minHeight: 88, flexGrow: 1, minWidth: 210,
  },
  kpiIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 10 },
  kpiTitle: { color: "#0b2344ff", fontWeight: "700", fontSize: 14 },
  kpiValue: { color: "#000000ff", fontWeight: "800", fontSize: 16 },

  /* Charts */
  chartsRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  chartCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cardTitle: { fontWeight: "700", color: "#0f172a", marginBottom: 8 , fontSize: 16},

  /* Tooltip */
  tooltip: {
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
    elevation: 4,
  },
  tooltipTitle: { fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  tipRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  tipDot: { width: 8, height: 8, borderRadius: 999, marginRight: 6 },
  tipLabel: { color: "#64748b", fontWeight: "700", fontSize: 12, flex: 1 },
  tipValue: { color: "#0f172a", fontWeight: "800", fontSize: 12 },

  // Etiquetas de ejes
  yLabel: { color: "#475569", fontSize: 11, textAlign: "right" },
  xLabel: { color: "#475569", fontSize: 11 },

  /* Tablas */
  blockTitle: { fontWeight: "700", marginBottom: 8, color: "#0f172a", fontSize:16},
  tableBlock: { marginTop: 16 },
  table: { width: "100%", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },
  thead: { backgroundColor: "#eef2f7", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tr: { flexDirection: "row", backgroundColor: "#fff" },
  th: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, fontWeight: "800", color: "#334155" },
  td: { flex: 1, paddingVertical: 12, paddingHorizontal: 12, color: "#0f172a", borderTopWidth: 1, borderTopColor: "#f1f5f9" },
});
