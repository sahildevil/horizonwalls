import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  View,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const cardWidth = width - 30;
const cardHeight = 180;

const CategoryCard = ({ name, imageUrl, id }) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const handlePress = () => {
    router.push({
      pathname: "/Screens/categoryScreen",
      params: { id, name },
    });
  };

  console.log("CategoryCard props:", { name, imageUrl, id }); // Debug log

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
        onError={(e) => {
          console.error("Image loading error:", e.nativeEvent.error);
          setImageError(true);
        }}
      >
        {imageError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load image</Text>
          </View>
        ) : (
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradient}
          >
            <Text style={styles.name}>{name}</Text>
          </LinearGradient>
        )}
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardHeight,
    marginBottom: 15,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: "#f0f0f0",
  },
  imageBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: 20,
  },
  imageStyle: {
    borderRadius: 20,
  },
  gradient: {
    height: "50%",
    justifyContent: "flex-end",
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  name: {
    fontFamily: "Outfit-Bold",
    fontSize: 24,
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 20,
  },
  errorText: {
    fontFamily: "Outfit-Regular",
    color: "#666",
    fontSize: 16,
  },
});

export default CategoryCard;
