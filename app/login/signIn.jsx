import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
  Image,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../providers/AuthProvider";
import { useRouter } from "expo-router";

const SignIn = () => {
  const { signIn, loading, user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      router.replace("/(tabs)");
    }
  }, [user]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bgLanding.png")}
      style={styles.container}
    >
      <StatusBar translucent backgroundColor="transparent" style="light" />
      <Image
        source={require("../../assets/images/4.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>Horizon Walls</Text>
     
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Continue with Google</Text>
        )}
      </TouchableOpacity>
    </ImageBackground>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 32,
    fontFamily: "Tan-Mon",
    marginBottom: 30,
    color: "white",
    // textShadowColor: "rgba(0, 0, 0, 0.75)",
    // textShadowOffset: { width: -1, height: 1 },
    // textShadowRadius: 10,
  },
  title2: {
    fontSize: 15,
    fontFamily: "Outfit-Medium",
    marginBottom: 30,
    color: "white",
    // textShadowColor: "rgba(0, 0, 0, 0.75)",
    // textShadowOffset: { width: -1, height: 1 },
    // textShadowRadius: 10,
  },
  button: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    fontWeight: "600",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
