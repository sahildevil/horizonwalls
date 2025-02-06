import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Octicons from "@expo/vector-icons/Octicons";

export default function _layout() {
  const router = useRouter();

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
        tabBarInactiveTintColor: "gray", // Inactive tab color
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="home" size={24} color={focused ? "tomato" : "black"} />
          ),
        }}
      />

      <Tabs.Screen
        name="Categories"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="grid" size={26} color={focused ? "tomato" : "black"} />
          ),
        }}
      />

      <Tabs.Screen
        name="Favs"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, focused }) => (
            <Octicons name="heart" size={24} color={focused ? "tomato" : "black"} />
          ),
        }}
      />
    </Tabs>
  );
}
