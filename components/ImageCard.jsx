import {
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Text,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useTheme } from "../providers/ThemeProvider";

const { width } = Dimensions.get("window");
const cardWidth = (width - 30) / 2;

const ImageCard = ({ imageUrl, wallpaperName, style, id, params }) => {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleNavigate = () => {
    const encodedUrl = encodeURIComponent(imageUrl);
    const encodedName = encodeURIComponent(wallpaperName || "wallpaper"); // Fallback name if none provided

    console.log("Navigating with name:", wallpaperName);

    // Create navigation params
    const navigationParams = {
      imageUrl: encodedUrl,
      name: encodedName,
    };

    // Add id if it exists
    if (id) {
      navigationParams.id = id;
    }

    // Add categoryId if it exists in params
    if (params && params.categoryId) {
      navigationParams.categoryId = params.categoryId;
    }

    router.push({
      pathname: "/Screens",
      params: navigationParams,
    });
  };

  if (!imageUrl) {
    console.error("No image URL provided");
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: currentTheme.cardBackground },
        style,
      ]}
      onPress={handleNavigate}
    >
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="tomato" />
        </View>
      )}
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, hasError && styles.hiddenImage]}
        resizeMode="cover"
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(e) => {
          console.error("Image failed to load:", imageUrl, e.nativeEvent.error);
          setHasError(true);
          setIsLoading(false);
        }}
      />
      {/* {wallpaperName && (
        <Text style={[styles.name, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          {wallpaperName}
        </Text>
      )} */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardWidth * 1.2,
    margin: 0,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  hiddenImage: {
    display: "none",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    color: "white",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Outfit-Medium",
  },
});

export default ImageCard;
