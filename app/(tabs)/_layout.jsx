import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Octicons from "@expo/vector-icons/Octicons";
import { useTheme } from "../../providers/ThemeProvider";
import { View, StyleSheet } from "react-native";

export default function _layout() {
  const router = useRouter();
  const { isDarkTheme, currentTheme } = useTheme();

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
          backgroundColor: currentTheme.background,
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Feather
                name="home"
                size={24}
                color={focused ? "tomato" : color}
              />
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
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
