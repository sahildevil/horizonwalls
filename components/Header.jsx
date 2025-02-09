import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";

const Header = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Feather name="menu" size={24} color="black" />
      <Text style={styles.heading}>Horizon Walls</Text>
      {/* <Image
        source={require("../assets/images/logo.png")}
        style={styles.applogo}
      /> */}
      <TouchableOpacity
        onPress={() => {
          router.push("/SearchScreen");
        }}
      >
        <Feather name="search" size={24} color="black" />
      </TouchableOpacity>
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
    paddingTop: 40,
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
