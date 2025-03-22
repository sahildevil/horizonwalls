import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Linking,
  Platform, // Add this import
} from "react-native";
import React, { useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import Modal from "react-native-modal";
import { useAuth } from "../providers/AuthProvider";
import { useTheme } from "../providers/ThemeProvider";
import Entypo from "@expo/vector-icons/Entypo";
import { StatusBar } from "expo-status-bar";
import { StatusBar as RNStatusBar } from "react-native";
import NotificationPrompt from "./NotificationPrompt"; // Import the NotificationPrompt component

const Header = () => {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { isDarkTheme, toggleTheme, currentTheme } = useTheme();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false); // State to control NotificationPrompt

  const toggleMenu = () => setIsMenuVisible(!isMenuVisible);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Close menu first
      toggleMenu();
      // Then redirect
      setTimeout(() => {
        router.replace("/login");
      }, 100);
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const menuItems = [
    {
      icon: "info",
      label: "About Us",
      onPress: () => {
        router.push("/AboutUs");
      },
    },
    {
      icon: "mail",
      label: "Contact Us",
      onPress: () => {
        router.push("/ContactUs");
      },
    },
    { icon: "star", label: "Rate App", onPress: () => console.log("Rate App") },
    {
      icon: "share-2",
      label: "Share App",
      onPress: () => console.log("Share App"),
    },
    {
      icon: "bell",
      label: "Notification Preference", // Add Notification Preference option
      onPress: () => {
        setShowNotificationPrompt(true); // Show the NotificationPrompt
        toggleMenu(); // Close the menu
      },
    },
    {
      icon: "book-open",
      label: "Privacy Policy",
      onPress: () => {
        Linking.openURL(
          "https://www.termsfeed.com/live/2844d51a-9a57-40fe-8138-c6dcb682c7ca"
        ).catch((err) => {
          console.error("Failed to open Privacy Policy URL:", err);
          Alert.alert(
            "Error",
            "Could not open privacy policy link. Please try again later."
          );
        });
      },
    },
    {
      icon: "moon",
      label: isDarkTheme ? "Light Theme" : "Dark Theme",
      onPress: toggleTheme,
    },
    {
      icon: "log-out",
      label: "Sign Out",
      onPress: handleSignOut,
      style: { borderBottomWidth: 0, marginTop: "auto" },
    },
  ];

  return (
    <>
      <StatusBar style={isDarkTheme ? "light" : "dark"} />
      <View
        style={[styles.container, { backgroundColor: currentTheme.background }]}
      >
        <TouchableOpacity onPress={toggleMenu}>
          <Feather name="menu" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: currentTheme.text }]}>
          Horizon Walls
        </Text>
        <TouchableOpacity onPress={() => router.push("/SearchScreen")}>
          <Feather name="search" size={24} color={currentTheme.text} />
        </TouchableOpacity>

        <Modal
          isVisible={isMenuVisible}
          onBackdropPress={toggleMenu}
          animationIn="slideInLeft"
          animationOut="slideOutLeft"
          style={styles.modal}
        >
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: currentTheme.background },
            ]}
          >
            <View style={styles.menuHeader}>
              <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
                <Feather name="x" size={24} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuProfile}>
              <Image
                source={require("../assets/images/6.png")}
                style={styles.menuLogo}
              />
              <Text style={[styles.menuAppName, { color: currentTheme.text }]}>
                Horizon Walls
              </Text>
            </View>

            <View style={styles.menuContent}>
              <View
                style={[
                  styles.menuBox,
                  { backgroundColor: currentTheme.cardBackground },
                ]}
              >
                {menuItems
                  .filter((item) => item.label !== "Sign Out")
                  .map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.menuItem}
                      onPress={() => {
                        item.onPress();
                        toggleMenu();
                      }}
                    >
                      <Feather
                        name={item.icon}
                        size={20}
                        color={currentTheme.text}
                      />
                      <Text
                        style={[
                          styles.menuItemText,
                          { color: currentTheme.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.signOutButton,
                  { backgroundColor: currentTheme.cardBackground },
                ]}
                onPress={() => {
                  handleSignOut();
                  toggleMenu();
                }}
              >
                <Feather name="log-out" size={20} color={currentTheme.text} />
                <Text
                  style={[styles.menuItemText, { color: currentTheme.text }]}
                >
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      {/* Render NotificationPrompt */}
      {showNotificationPrompt && (
        <NotificationPrompt
          triggerManually={true}
          onClose={() => setShowNotificationPrompt(false)} // Close the prompt when done
        />
      )}
    </>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop:
      Platform.OS === "android"
        ? RNStatusBar.currentHeight // Add some extra padding
        : 20,
    paddingBottom: 10,
  },
  heading: {
    fontFamily: "Tan-Mon",
    fontSize: 22,
  },
  menuContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  modal: {
    margin: 0,
  },
  menuContainer: {
    width: "70%",
    height: "100%",
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  menuHeader: {
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  menuItemText: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    marginLeft: 15,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginTop: 20,
    width: "50%",
  },
  menuProfile: {
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333", // Changed from "#eee" for better visibility in dark mode
  },
  menuLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 10,
  },
  menuAppName: {
    fontFamily: "Tan-Mon",
    fontSize: 24,
    textAlign: "center",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
  },
  menuBox: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    alignSelf: "stretch",
  },
});
