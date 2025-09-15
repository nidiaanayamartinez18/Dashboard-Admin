import React, { PropsWithChildren, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/* =============== Helpers de color (hex -> mezcla con blanco) =============== */
const clamp = (n: number, min = 0, max = 255) => Math.min(max, Math.max(min, n));
const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
};
const mixWithWhite = (hex: string, ratio: number) => {
  // ratio: 0 = color puro, 1 = blanco
  const { r, g, b } = hexToRgb(hex);
  const rr = clamp(Math.round(r + (255 - r) * ratio));
  const gg = clamp(Math.round(g + (255 - g) * ratio));
  const bb = clamp(Math.round(b + (255 - b) * ratio));
  return `rgb(${rr},${gg},${bb})`;
};

/* =============== Layout row (sin gap) =============== */
export const CardsRow = ({ children }: PropsWithChildren) => (
  <View style={styles.row}>{children}</View>
);

/* =============== Card =============== */
type StatCardProps = {
  label: string;
  value: number | string;
  pct?: number;
  color?: string;           // color base (primario)
  icon?: React.ReactNode;   // ícono opcional
  onPress?: () => void;
  variant?: "solid" | "soft" | "outline"; // estilo de relleno
};

export function StatCard({
  label,
  value,
  pct,
  color = "#7c3aed",
  icon,
  onPress,
  variant = "solid", // <- por defecto con relleno de color
}: StatCardProps) {
  // paleta derivada del color base
  const bg =
    variant === "solid" ? mixWithWhite(color, 0.88) :
    variant === "soft"  ? mixWithWhite(color, 0.93) :
                          "#fff";
  const border = variant === "outline" ? mixWithWhite(color, 0.80) : mixWithWhite(color, 0.78);
  const iconBg = mixWithWhite(color, 0.80);
  const chipBg = mixWithWhite(color, 0.86);

  // animación press / hover
  const scale = useSharedValue(1);
  const shadow = useSharedValue(0.08);
  const ring = useSharedValue(0); // halo al presionar

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadow.value,
    borderColor: border,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.985, { damping: 18, stiffness: 180 });
    shadow.value = withTiming(0.12, { duration: 120 });
    ring.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 16, stiffness: 180 });
    shadow.value = withTiming(0.08, { duration: 120 });
    ring.value = withTiming(0, { duration: 180 });
  };

  const showPct = typeof pct === "number";
  const pctSafe = Math.max(0, Math.min(100, showPct ? pct! : 0));

  // animación sutil de progresión (escala X desde 0 a pct)
  const progress = useSharedValue(showPct ? pctSafe / 100 : 0);
  useEffect(() => {
    progress.value = withTiming(showPct ? pctSafe / 100 : 0, { duration: 600 });
  }, [pctSafe, showPct]);

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={() => (shadow.value = withTiming(0.13, { duration: 120 }))}
      onHoverOut={() => (shadow.value = withTiming(0.08, { duration: 120 }))}
      style={{ marginRight: 12 }}
    >
      {/* Halo */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          { backgroundColor: mixWithWhite(color, 0.65) },
          ringStyle,
        ]}
      />
      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: bg,
            borderColor: border,
          },
          variant === "outline" ? { backgroundColor: "#fff" } : null,
          animatedStyle,
        ]}
      >
        {/* Top: icono + chip % (si no hay, lo reservamos visualmente para que todas midan igual) */}
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            {icon}
          </View>
          <View style={styles.badgeBox}>
            <View style={[styles.badge, { backgroundColor: chipBg }, !showPct && styles.badgeGhost]}>
              <Text style={[styles.badgeText, !showPct && styles.badgeTextGhost]}>
                {showPct ? `${pctSafe}%` : "00%"}
              </Text>
            </View>
          </View>
        </View>

        {/* Valor + etiqueta */}
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>

        {/* Progreso (con animación) */}
        <View style={[styles.progressTrack, { backgroundColor: mixWithWhite(color, 0.90) }, !showPct && styles.progressGhost]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: color },
              progressStyle,
            ]}
          />
        </View>

        {/* Línea/acento inferior */}
        <View style={[styles.accent, { backgroundColor: color }]} />
      </Animated.View>
    </Pressable>
  );
}

/* =============== Estilos =============== */
const CARD_WIDTH = 210;
const CARD_MIN_HEIGHT = 160;

const styles = StyleSheet.create({
  row: { flexDirection: "row" }, // sin gap; separación con marginRight
  ring: {
    position: "absolute",
    left: -2, right: 10, top: -2, bottom: -2,
    borderRadius: 22,
    opacity: 0,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: CARD_MIN_HEIGHT,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },

  badgeBox: { minWidth: 48, alignItems: "flex-end" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeGhost: { opacity: 0 },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#0f172a" },
  badgeTextGhost: { color: "transparent" },

  value: { fontSize: 28, fontWeight: "900", marginTop: 8, color: "#0f172a" },
  label: { fontSize: 12, color: "#334155", marginTop: 2 },

  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 12,
  },
  progressFill: {
    height: 6,
    borderRadius: 999,
    width: "100%",            // usamos scaleX animado
    transform: [{ scaleX: 0 }],
    transformOrigin: "left",  // RN lo interpreta razonablemente para scaleX
  },
  progressGhost: { opacity: 0 },

  accent: {
    position: "absolute",
    left: 8, right: 8, bottom: 6, height: 3,
    borderRadius: 999,
  },
});
