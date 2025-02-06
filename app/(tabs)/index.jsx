import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Header from "../../components/Header";
import Feather from '@expo/vector-icons/Feather';
const index = () => {
  return (
    <View style={styles.container}>
      <Header />
      <Text>Home</Text>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
});
