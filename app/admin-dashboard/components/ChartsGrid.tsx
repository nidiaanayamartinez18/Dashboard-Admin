import React, { PropsWithChildren } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

type Props = PropsWithChildren<{
  /** separación en px entre charts */
  spacing?: number;
  /** ancho a partir del cual se muestran en columnas (px) */
  breakpoint?: number;
}>;

/**
 * Contenedor responsive para charts:
 * - Móvil: apilados (columna)
 * - Desktop: dos columnas (fila)
 * Sin usar `gap`; usa marginRight / marginBottom.
 */
export default function ChartsGrid({ children, spacing = 12, breakpoint = 900 }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= breakpoint;
  const items = React.Children.toArray(children);

  return (
    <View style={[styles.container, isWide ? styles.row : styles.col]}>
      {items.map((child, idx) => {
        const isLast = idx === items.length - 1;

        // En fila: margen a la derecha entre items
        // En columna: margen abajo entre items
        const itemStyle = isWide
          ? [styles.itemRow, !isLast && { marginRight: spacing }]
          : [styles.itemCol, !isLast && { marginBottom: spacing }];

        return (
          <View key={idx} style={itemStyle}>
            {child}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  row: { flexDirection: "row", alignItems: "stretch" },
  col: { flexDirection: "column" },
  // En fila cada chart ocupa el mismo espacio y permite encoger para evitar overflow en web
  itemRow: { flex: 1, minWidth: 0 },
  // En columna ocupa todo el ancho
  itemCol: { width: "100%" },
});
