// import {
//   Image,
//   StyleSheet,
//   View,
//   TouchableOpacity,
//   Dimensions,
// } from "react-native";
// import React from "react";
// import { useRouter } from "expo-router";

// const { width } = Dimensions.get("window");
// const cardWidth = (width - 30) / 2;

// const ImageCard = ({ imageUrl }) => {
//   const router = useRouter();

//   const handleNavigate = () => {
//     const encodedUrl = encodeURIComponent(imageUrl);
//     const encodedName = encodeURIComponent(wallpaperName); // Add this prop to ImageCard

//     router.push({
//       pathname: "/Screens",
//       params: {
//         imageUrl: encodedUrl,
//         name: encodedName,
//       },
//     });
//   };

//   return (
//     <TouchableOpacity style={styles.container} onPress={handleNavigate}>
//       <Image
//         source={{ uri: imageUrl }}
//         style={styles.image}
//         resizeMode="cover"
//         onError={(e) => {
//           console.error("Image failed to load:", imageUrl); // Log any errors
//           e.target.style.display = "none"; // Hide the image if it fails
//         }}
//       />
//     </TouchableOpacity>
//   );
// };

// export default ImageCard;

// const styles = StyleSheet.create({
//   container: {
//     width: cardWidth,
//     height: cardWidth * 1.2,
//     margin: 5,
//     borderRadius: 20,
//     overflow: "hidden",
//     position: "relative",
//   },
//   image: {
//     width: "100%",
//     height: "100%",
//   },
// });
import {
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const cardWidth = (width - 30) / 2;

const ImageCard = ({ imageUrl, wallpaperName }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleNavigate = () => {
    const encodedUrl = encodeURIComponent(imageUrl);
    const encodedName = encodeURIComponent(wallpaperName || "wallpaper"); // Fallback name if none provided

    console.log("Navigating with name:", wallpaperName);

    router.push({
      pathname: "/Screens",
      params: {
        imageUrl: encodedUrl,
        name: encodedName,
      },
    });
  };

  if (!imageUrl) {
    console.error("No image URL provided");
    return null;
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handleNavigate}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3498db" />
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardWidth * 1.2,
    margin: 5,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f0f0f0",
  },
  image: {
    width: "100%",
    height: "100%",
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
});

export default ImageCard;
