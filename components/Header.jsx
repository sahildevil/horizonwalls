import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import React, { useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import Modal from "react-native-modal";
import { useAuth } from "../providers/AuthProvider";

const Header = () => {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [isMenuVisible, setIsMenuVisible] = useState(false);

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
      icon: "log-out",
      label: "Sign Out",
      onPress: handleSignOut,
      style: { borderBottomWidth: 0, marginTop: "auto" },
    },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleMenu}>
        <Feather name="menu" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.heading}>Horizon Walls</Text>
      <TouchableOpacity onPress={() => router.push("/SearchScreen")}>
        <Feather name="search" size={24} color="black" />
      </TouchableOpacity>

      <Modal
        isVisible={isMenuVisible}
        onBackdropPress={toggleMenu}
        animationIn="slideInLeft"
        animationOut="slideOutLeft"
        style={styles.modal}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
              <Feather name="x" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuProfile}>
            <Image
              source={require("../assets/images/logoicon.png")}
              style={styles.menuLogo}
            />
            <Text style={styles.menuAppName}>Horizon Walls</Text>
          </View>

          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, item.style]}
              onPress={() => {
                item.onPress();
                toggleMenu();
              }}
            >
              <Feather name={item.icon} size={20} color="black" />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 50,
    backgroundColor: "white",
  },
  heading: {
    fontFamily: "Outfit-Bold",
    fontSize: 24,
  },
  modal: {
    margin: 0,
  },
  menuContainer: {
    backgroundColor: "white",
    width: "70%",
    height: "100%",
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  menuHeader: {
    marginBottom: 10,
  },
  menuTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuItemText: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    marginLeft: 15,
  },
  signOutButton: {
    marginTop: "auto",
    borderBottomWidth: 0,
  },
  menuProfile: {
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 10,
  },
  menuAppName: {
    fontFamily: "Outfit-Bold",
    fontSize: 24,
    color: "#1a1a1a",
    textAlign: "center",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
  },
});
