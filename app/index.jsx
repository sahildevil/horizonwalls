import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import React, { useEffect } from "react";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    }
  }, [isLoaded, isSignedIn]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4285F4" />
      <Text style={styles.loadingText}>
        {!isLoaded ? "Checking authentication..." : ""}
        {isLoaded && !isSignedIn ? "Redirecting to login..." : ""}
        {isLoaded && isSignedIn ? "Loading app..." : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});
