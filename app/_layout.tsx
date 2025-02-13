import { Stack } from "expo-router";
import { AuthProvider } from "../providers/auth";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="Screens" />
        <Stack.Screen name="SearchScreen" />
      </Stack>
    </AuthProvider>
  );
}
