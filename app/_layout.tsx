// app/_layout.tsx
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import { Sora_600SemiBold, Sora_700Bold, useFonts } from "@expo-google-fonts/sora";
import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout() {
  const [loaded] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
  });

  if (!loaded) {
    // Puedes poner tu splash / loader aquí si quieres
    return <View />;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
