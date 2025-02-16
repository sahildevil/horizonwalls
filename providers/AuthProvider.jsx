import React, { createContext, useContext, useEffect, useState } from "react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId:
        "102249209505-s77ev595lnraqpv8a6a07het83g17o8o.apps.googleusercontent.com",
      offlineAccess: true,
    });

    const checkUserSignIn = async () => {
      try {
        const hasPreviousSignIn = await GoogleSignin.hasPreviousSignIn();
        if (hasPreviousSignIn) {
          const userInfo = await GoogleSignin.signInSilently();
          await handleSignInSuccess(userInfo);
        }
      } catch (error) {
        console.error("Error checking user sign-in status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserSignIn();
  }, []);

  const handleSignInSuccess = async (userInfo) => {
    try {
      const userData = userInfo.user || userInfo;
      setUser(userData);
      await SecureStore.setItemAsync("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Error handling sign-in success:", error);
    }
  };

  const signIn = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      await handleSignInSuccess(userInfo);
    } catch (error) {
      console.error("Error during sign in:", error);
      Alert.alert(
        "Sign In Error",
        "There was an error signing in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await GoogleSignin.signOut();
      await SecureStore.deleteItemAsync("user");
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
