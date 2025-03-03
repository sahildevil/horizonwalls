import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Octicons from "@expo/vector-icons/Octicons";
import { useTheme } from "../../providers/ThemeProvider";
import {
  View,
  StyleSheet,
  Platform,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function _layout() {
  const router = useRouter();
  const { isDarkTheme, currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get("window");

  // Calculate tab bar width (70% of screen width)
  const tabBarWidth = screenWidth * 0.7;

  useEffect(() => {
    getUserDetails();
  }, []);

  const getUserDetails = async () => {
    const userInfo = await getLocalStorage("user");
    if (!userInfo) {
      router.replace("/login");
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "tomato", // Active tab color
        tabBarInactiveTintColor: isDarkTheme ? "#888" : "gray", // Inactive tab color
        tabBarStyle: {
          position: "absolute",
          bottom: insets.bottom + 15, // Add space at the bottom
          width: tabBarWidth,
          height: 60,
          backgroundColor: currentTheme.background,
          borderRadius: 20,
          borderTopWidth: 0,
          elevation: 8,
          alignSelf: "center", // Ensure it's centered
          marginHorizontal: (screenWidth - tabBarWidth) / 2,
          ...styles.shadow,
        },
        tabBarLabelStyle: {
          display: "none",
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarLabelPosition: "below-icon",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Octicons
                name="home"
                size={24}
                color={focused ? "tomato" : color}
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="Categories"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Feather
                name="grid"
                size={25}
                color={focused ? "tomato" : color}
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="Favs"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Octicons
                name="heart"
                size={24}
                color={focused ? "tomato" : color}
              />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    position: "relative",
  },
  activeDot: {
    position: "absolute",
    bottom: -12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "tomato",
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
});
