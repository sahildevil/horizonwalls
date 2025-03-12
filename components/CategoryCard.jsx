import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const CategoryCard = ({ category, style }) => {
  const router = useRouter();

  // Handle both data formats: direct category object or nested properties
  const name = category?.name || "Category";
  const imageUrl = category?.imageUrl || "https://via.placeholder.com/150";
  const id = category?.$id || "unknown";

  // Log for debugging
  //console.log("CategoryCard:", { id, name, imageUrl });

  const handlePress = () => {
    router.push({
      pathname: "/Screens/categoryScreen",
      params: {
        categoryId: id,
        categoryName: encodeURIComponent(name),
      },
    });
  };

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={handlePress}>
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.image}
        imageStyle={styles.imageStyle}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradient}
        >
          <Text style={styles.title}>{name}</Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  imageStyle: {
    borderRadius: 12,
  },
  gradient: {
    width: "100%",
    height: "50%",
    justifyContent: "flex-end",
    padding: 10,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default CategoryCard;
