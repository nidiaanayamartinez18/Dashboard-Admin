import React from "react";
import { StyleSheet, Text, View } from "react-native";
import * as Victory from "victory-native";

type DataPoint = { x: string | number; y: number };
type Props = { title: string; data: DataPoint[]; height?: number; suffixY?: string };

export default function MiniLineChart({ title, data, height = 240, suffixY }: Props) {
  if (
    !Victory.VictoryChart ||
    !Victory.VictoryLine ||
    !Victory.VictoryAxis ||
    !Victory.VictoryScatter
  ) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.fallback}>
          Charts no disponibles. Asegura victory-native / react-native-svg instalados.
        </Text>
      </View>
    );
  }

  const formatY = (t: number) => (suffixY ? `${Math.round(t)}${suffixY}` : `${Math.round(t)}`);

  const container =
    Victory.VictoryVoronoiContainer
      ? (
        <Victory.VictoryVoronoiContainer
          labels={({ datum }: any) => `${datum.x}\n${formatY(datum.y)}`
          }
          labelComponent={
            <Victory.VictoryTooltip
              flyoutStyle={{ fill: "#0b3a8a", strokeWidth: 0 }}
              style={{ fill: "#fff", fontSize: 10, fontWeight: "700" }}
              cornerRadius={8}
              pointerLength={6}
            />
          }
        />
      )
      : undefined;

  // dominio Y con margen
  const ys = data.map(d => d.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = Math.max(2, Math.round((maxY - minY) * 0.08));
  const domainY = [Math.max(0, minY - pad), maxY + pad];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <Victory.VictoryChart
        height={height}
        padding={{ top: 16, right: 16, bottom: 36, left: 48 }}
        domain={{ y: domainY }}
        domainPadding={{ x: 16, y: 8 }}
        containerComponent={container as any}
      >
        <Victory.VictoryAxis
          tickFormat={(t: string | number) => String(t)}
          style={{
            axis: { stroke: "#e5e7eb" },
            tickLabels: { fontSize: 18, fill: "#6b7280", padding: 6 },
          }}
        />
        <Victory.VictoryAxis
          dependentAxis
          tickFormat={(t: number) => formatY(t)}
          style={{
            axis: { stroke: "transparent" },
            grid: { stroke: "#eef2f7" },
            tickLabels: { fontSize: 18, fill: "#6b7280", padding: 6 },
          }}
          tickCount={5}
        />

        {/* Área tenue debajo de la línea (si está disponible) */}
        {Victory.VictoryArea ? (
          <Victory.VictoryArea
            data={data}
            interpolation="monotoneX"
            style={{ data: { fill: "#059669", opacity: 0.15 } }}
            animate={{ duration: 600 }}
          />
        ) : null}

        <Victory.VictoryLine
          data={data}
          interpolation="monotoneX"
          style={{ data: { stroke: "#059669", strokeWidth: 3 } }}
          animate={{ duration: 600 }}
        />
        <Victory.VictoryScatter
          data={data}
          size={3.8}
          style={{ data: { fill: "#059669", stroke: "#fff", strokeWidth: 1 } }}
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
