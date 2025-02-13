import { ClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
      redirectUrl={process.env.EXPO_PUBLIC_CLERK_REDIRECT_URL}
      afterSignIn={() => router.replace("/(tabs)")}
      afterSignOut={() => router.replace("/login")}
      oauthOptions={{
        androidPackageName: "com.horizonwalls.sahil", // Update this with your actual package name
        androidHashedFingerprint: "99:BE:3D:AF:E5:43:5C:99:AB:B9:50:66:3E:CA:AC:98:9C:D9:80:93:11:7F:8A:02:B1:E3:DD:12:4A:52:6A:63" // Paste the SHA-256 value here
      }}
    >
      {children}
    </ClerkProvider>
  );
}