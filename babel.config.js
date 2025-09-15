module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      require.resolve("expo-router/babel"), // 👈 genera tipos de rutas
      "react-native-reanimated/plugin",     // 👈 SIEMPRE al final
    ],
  };
};
