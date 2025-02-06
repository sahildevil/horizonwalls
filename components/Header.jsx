import { Image, StyleSheet, Text, View } from "react-native";
import React from "react";
import Feather from "@expo/vector-icons/Feather";

const Header = () => {
  return (
    <View style={styles.container}>
      <Feather name="menu" size={24} color="black" />
      <Text style={styles.heading}>Horizon Walls</Text>
      {/* <Image
        source={require("../assets/images/logo.png")}
        style={styles.applogo}
      /> */}
      <Feather name="search" size={24} color="black" />
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
    paddingVertical: 10,
  },
  applogo: {
    width: 50,
    height: 50,
  },
  heading: {
    fontWeight: "bold",
    fontSize: 24,
  },
});
