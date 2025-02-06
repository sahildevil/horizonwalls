// import { Image, StyleSheet, View } from "react-native";
// import React from "react";
// import Feather from "@expo/vector-icons/Feather";

// const ImageCard = ({ imageUrl }) => {
//   console.log("Image URL:", imageUrl); // Add this line to log the imageUrl
//   return (
//     <View style={styles.container}>
//       <Image
//         source={{ uri: imageUrl }}
//         style={styles.image}
//         resizeMode="cover"
//       />

//       {/* Heart Icon Overlay */}
//       <View style={styles.iconContainer}>
//         <Feather name="heart" size={30} color="white" />
//       </View>
//     </View>
//   );
// };

// export default ImageCard;

// const styles = StyleSheet.create({
//   container: {
//     alignContent: "center",
//     alignItems: "center",
//     height: "40%",
//     width: "45%",
//     backgroundColor: "pink",
//     borderRadius: 20,
//     overflow: "hidden",
//     position: "relative", // Ensures absolute positioning works inside
//   },
//   image: {
//     width: "100%",
//     height: "100%",
//   },
//   iconContainer: {
//     position: "absolute", // Positions the icon over the image
//     bottom: 10, // Distance from bottom
//     left: 10, // Distance from left
//     backgroundColor: "rgba(0, 0, 0, 0.5)", // Optional: Adds background for better visibility
//     padding: 8,
//     borderRadius: 20, // Makes it rounded
//   },
// });
import { Image, StyleSheet, View, Dimensions } from "react-native";
import React from "react";
import Feather from "@expo/vector-icons/Feather";

const { width } = Dimensions.get("window");
const cardWidth = (width - 30) / 2; // Account for horizontal padding

const ImageCard = ({ imageUrl }) => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.iconContainer}>
        <Feather name="heart" size={30} color="white" />
      </View>
    </View>
  );
};

export default ImageCard;

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardWidth * 1.2, // Maintain aspect ratio
    margin: 5,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  iconContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
    borderRadius: 20,
  },
});
