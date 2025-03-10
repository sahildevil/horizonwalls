import { Stack } from "expo-router";
import { AuthProvider } from "../providers/AuthProvider";
import { useEffect, useState } from "react";
import * as Font from 'expo-font';
import { fonts } from '../config/fonts';
import { ThemeProvider } from "../providers/ThemeProvider";
import { ScrollProvider } from "../providers/ScrollContext";

export default function RootLayout() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync(fonts);
    }
    loadFonts();
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <ScrollProvider>
          <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="Screens" />
            <Stack.Screen name="SearchScreen" />
            <Stack.Screen name="AboutUs" />
            <Stack.Screen name="ContactUs" />
          </Stack>
        </ScrollProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
