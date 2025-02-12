import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useEffect } from "react";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

// Configure Google Sign In
GoogleSignin.configure({
  // Remove webClientId as it's not needed for Android-only auth
  androidClientId:
    "102249209505-rfneh3q79k0ji1b8q8ufj2bhr8q8b0vc.apps.googleusercontent.com",
});

function SignIn() {
  const router = useRouter();
  const { signIn: authSignIn } = useAuth();
  const [loading, setLoading] = React.useState(false);

  async function handleSignIn() {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      // Store user info in AsyncStorage and Context
      await AsyncStorage.setItem("@user", JSON.stringify(userInfo.user));
      await authSignIn(userInfo.user);

      router.replace("/(tabs)");
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Sign in cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("Sign in in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Play services not available");
      } else {
        Alert.alert("Something went wrong", error.toString());
        console.error("Sign in error:", error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>HorizonWalls</Text>
        <Text style={styles.subtitle}>Discover Amazing Wallpapers</Text>
      </View>

      <TouchableOpacity
        style={[styles.googleButton, loading && styles.googleButtonDisabled]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#666" />
        ) : (
          <>
            <Image
              source={require("../../assets/images/google.png")}
              style={styles.googleIcon}
            />
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    color: "#333",
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
});

export default SignIn;
