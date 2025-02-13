import { Stack } from "expo-router";
import { AuthProvider } from "../providers/auth";
import mobileAds from 'react-native-google-mobile-ads';
mobileAds()
  .initialize()
  .then(adapterStatuses => {
    console.log('Initialization complete!');
  });
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
