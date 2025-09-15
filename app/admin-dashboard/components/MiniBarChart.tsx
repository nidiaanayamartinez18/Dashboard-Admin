import React from "react";
import { StyleSheet, Text, View } from "react-native";
import * as Victory from "victory-native";

type DataPoint = { x: string | number; y: number };
type Props = { title: string; data: DataPoint[]; height?: number };

const fmtNum = (n: number) => {
  if (Math.abs(n) >= 1000000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
};

export default function MiniBarChart({ title, data, height = 240 }: Props) {
  // Fallback si algo no está disponible para evitar crashes
  if (!Victory.VictoryChart || !Victory.VictoryBar || !Victory.VictoryAxis) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.fallback}>
          Charts no disponibles. Asegura victory-native / react-native-svg instalados.
        </Text>
      </View>
    );
  }

  const barWidth = Math.max(6, Math.min(22, Math.floor(260 / Math.max(1, data.length))));
  const container =
    Victory.VictoryVoronoiContainer
      ? (
        <Victory.VictoryVoronoiContainer
          labels={({ datum }: any) => `${datum.x}\n${fmtNum(datum.y)}`}
          labelComponent={
            <Victory.VictoryTooltip
              flyoutStyle={{ fill: "#0b3a8a", strokeWidth: 0 }}
              style={{ fill: "#fff", fontSize: 16, fontWeight: "700" }}
              cornerRadius={8}
              pointerLength={6}
            />
          }
        />
      )
      : undefined;

  // Eje Y bonito (5 ticks, redondea al múltiplo)
  const maxY = Math.max(...data.map(d => d.y), 0);
  const step = maxY > 1000 ? 200 : maxY > 300 ? 100 : 50;
  const yMax = Math.ceil(maxY / step) * step || step;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <Victory.VictoryChart
        height={height}
        padding={{ top: 16, right: 16, bottom: 36, left: 48 }}
        domain={{ y: [0, yMax] }}
        domainPadding={{ x: 18, y: 8 }}
        containerComponent={container as any}
      >
        <Victory.VictoryAxis
          tickFormat={(t: string | number) => String(t)}
          style={{
            axis: { stroke: "#e5e7eb" },
            tickLabels: { fontSize: 18, fill: "#6b7280", padding: 6 },
            ticks: { stroke: "#e5e7eb" },
          }}
        />
        <Victory.VictoryAxis
          dependentAxis
          tickFormat={(t: number) => fmtNum(t)}
          style={{
            axis: { stroke: "transparent" },
            grid: { stroke: "#eef2f7" },
            tickLabels: { fontSize: 18, fill: "#6b7280", padding: 6 },
          }}
          tickCount={5}
        />

        <Victory.VictoryBar
          data={data}
          cornerRadius={{ top: 4 }}
          barWidth={barWidth}
          style={{
            data: { fill: "#b3845dff" },
            labels: { fontSize: 14, fill: "#111827" },
          }}
          animate={{ duration: 600 }}
        />
      </Victory.VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", padding: 14, borderRadius: 12 },
  title: { fontWeight: "700", marginBottom: 6, fontSize: 14 },
  fallback: { color: "#6b7280", fontSize: 12 },
});
