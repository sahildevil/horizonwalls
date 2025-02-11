import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import Modal from "react-native-modal";

const Header = () => {
  const router = useRouter();
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const toggleMenu = () => setIsMenuVisible(!isMenuVisible);

  const menuItems = [
    { icon: "info", label: "About Us", onPress: () => console.log("About Us") },
    {
      icon: "mail",
      label: "Contact Us",
      onPress: () => console.log("Contact Us"),
    },
    { icon: "star", label: "Rate App", onPress: () => console.log("Rate App") },
    {
      icon: "share-2",
      label: "Share App",
      onPress: () => console.log("Share App"),
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
            <Text style={styles.menuTitle}>Menu</Text>
            <TouchableOpacity onPress={toggleMenu}>
              <Feather name="x" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
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
    fontWeight: "bold",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
  },
});
