import { Stack } from "expo-router";
import { AuthProvider } from "../providers/auth";
import { useEffect } from "react";
import { initializeMobileAds } from "../config/mobileAds";
import * as Font from 'expo-font';
import { fonts } from '../config/fonts';

export default function RootLayout() {
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync(fonts);
    }
    loadFonts();
    initializeMobileAds();
  }, []);

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
