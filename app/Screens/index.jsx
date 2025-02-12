import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
} from "react-native";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ManageWallpaper, { TYPE } from "react-native-manage-wallpaper";
const { width, height } = Dimensions.get("window");

const Screens = () => {
  const params = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [decodedUrl, setDecodedUrl] = useState(null);
  const [wallpaperName, setWallpaperName] = useState(null);
  const router = useRouter();
  useEffect(() => {
    // Check if wallpaper is in favorites when component mounts
    checkFavorite();
  }, [decodedUrl]);
  const checkFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem("favorites");
      const favoritesArray = favorites ? JSON.parse(favorites) : [];
      setIsFavorite(favoritesArray.some((fav) => fav.imageUrl === decodedUrl));
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };
  const toggleFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem("favorites");
      const favoritesArray = favorites ? JSON.parse(favorites) : [];

      if (isFavorite) {
        // Remove from favorites
        const newFavorites = favoritesArray.filter(
          (fav) => fav.imageUrl !== decodedUrl
        );
        await AsyncStorage.setItem("favorites", JSON.stringify(newFavorites));
        setIsFavorite(false);
        Alert.alert("Removed from favorites");
      } else {
        // Add to favorites
        const newFavorite = {
          imageUrl: decodedUrl,
          name: wallpaperName,
          addedAt: new Date().toISOString(),
        };
        const newFavorites = [...favoritesArray, newFavorite];
        await AsyncStorage.setItem("favorites", JSON.stringify(newFavorites));
        setIsFavorite(true);
        Alert.alert("Added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorites");
    }
  };

  useEffect(() => {
    if (params.imageUrl) {
      const decoded = decodeURIComponent(params.imageUrl);
      setDecodedUrl(decoded);
    }
    if (params.name) {
      const decodedName = decodeURIComponent(params.name);
      setWallpaperName(decodedName);
    }
  }, [params.imageUrl, params.name]);

  const sanitizeFileName = (name) => {
    // Remove invalid characters and spaces
    return name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  };

  const getFileExtension = (url) => {
    // Try to get extension from URL
    const urlExtension = url.split(".").pop().split(/[#?]/)[0];
    const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

    if (validExtensions.includes(urlExtension.toLowerCase())) {
      return urlExtension.toLowerCase();
    }

    // Default to png if no valid extension found
    return "png";
  };

  const downloadImage = async () => {
    if (!decodedUrl) return;

    try {
      // Create filename using wallpaper name if available
      const extension = getFileExtension(decodedUrl);
      const baseFileName = wallpaperName
        ? sanitizeFileName(wallpaperName)
        : "wallpaper_" + new Date().getTime();
      const filename = `${baseFileName}.${extension}`;

      console.log("Saving with filename:", filename);

      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Step 1: Download the Image
      const { uri } = await FileSystem.downloadAsync(decodedUrl, fileUri);

      // Step 2: Request Media Library Permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Allow access to save images.");
        return;
      }

      // Step 3: Save to Gallery
      const asset = await MediaLibrary.createAssetAsync(uri);

      // Step 4: Create album and move asset (optional)
      try {
        const album = await MediaLibrary.getAlbumAsync("HorizonWalls");
        if (album === null) {
          await MediaLibrary.createAlbumAsync("HorizonWalls", asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (error) {
        console.error("Album error:", error);
        // Continue even if album creation fails
      }

      Alert.alert(
        "Download Complete",
        `Wallpaper saved as "${filename}" in your gallery!`
      );
      console.log("Saved at:", uri);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to download image.");
    }
  };

  const wallpaperCallback = (res) => {
    console.log("Wallpaper Response:", res);
    if (res.status === "success") {
      Alert.alert("Success", "Wallpaper set successfully!");
    } else {
      Alert.alert("Error", "Failed to set wallpaper");
    }
  };
  const setWallpaper = () => {};
  // const setWallpaper = async () => {
  //   if (!decodedUrl) return;

  //   try {
  //     // Request storage permissions for Android
  //     if (Platform.OS === "android") {
  //       const permission = await PermissionsAndroid.request(
  //         PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
  //       );
  //       if (permission !== "granted") {
  //         Alert.alert(
  //           "Permission Denied",
  //           "Please grant storage permission to set wallpaper."
  //         );
  //         return;
  //       }
  //     }

  //     // First download the image
  //     const filename = `temp_wallpaper_${Date.now()}.${getFileExtension(
  //       decodedUrl
  //     )}`;
  //     const fileUri = `${FileSystem.documentDirectory}${filename}`;

  //     // Download image
  //     const { uri } = await FileSystem.downloadAsync(decodedUrl, fileUri);

  //     // Save to media library
  //     const asset = await MediaLibrary.createAssetAsync(uri);

  //     try {
  //       const album = await MediaLibrary.getAlbumAsync("HorizonWalls");
  //       if (album === null) {
  //         await MediaLibrary.createAlbumAsync("HorizonWalls", asset, false);
  //       } else {
  //         await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  //       }

  //       // Guide user to set wallpaper through system settings
  //       Alert.alert(
  //         "Wallpaper Downloaded",
  //         "The image has been saved to your gallery. Would you like to set it as wallpaper?",
  //         [
  //           {
  //             text: "Set Wallpaper",
  //             onPress: async () => {
  //               if (Platform.OS === "android") {
  //                 try {
  //                   await Linking.sendIntent(
  //                     "android.intent.action.SET_WALLPAPER"
  //                   );
  //                 } catch (error) {
  //                   console.error("Failed to open wallpaper settings:", error);
  //                   Alert.alert(
  //                     "Manual Setup Required",
  //                     "Please go to your device settings to set the wallpaper."
  //                   );
  //                 }
  //               } else {
  //                 Alert.alert(
  //                   "Set Wallpaper",
  //                   "Please go to your device settings to set the wallpaper."
  //                 );
  //               }
  //             },
  //           },
  //           {
  //             text: "Cancel",
  //             style: "cancel",
  //           },
  //         ]
  //       );
  //     } catch (error) {
  //       console.error("Album error:", error);
  //       Alert.alert("Error", "Failed to save wallpaper");
  //     }

  //     // Clean up temporary file
  //     await FileSystem.deleteAsync(fileUri);
  //   } catch (error) {
  //     console.error("Wallpaper setup error:", error);
  //     Alert.alert("Error", "Failed to prepare wallpaper");
  //   }
  // };

  return (
    <View style={styles.container}>
      <StatusBar translucent style="auto" />
      {decodedUrl && (
        <Image
          source={{ uri: decodedUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <TouchableOpacity style={styles.backbutton} onPress={() => router.back()}>
        <Ionicons name="chevron-back-outline" size={24} color="white" />
      </TouchableOpacity>

      <BlurView intensity={50} tint="dark" style={styles.toolbar}>
        <TouchableOpacity onPress={downloadImage}>
          <Feather name="download" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={setWallpaper}>
          <MaterialIcons name="now-wallpaper" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleFavorite}>
          <AntDesign
            name={isFavorite ? "heart" : "hearto"}
            size={24}
            color={isFavorite ? "#ff4757" : "white"}
          />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

export default Screens;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  image: {
    width,
    height,
    position: "absolute",
    top: 0,
    left: 0,
  },
  backbutton: {
    marginLeft: 30,
    marginTop: 50,
    backgroundColor: "black",
    height: 40,
    width: 40,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    position: "absolute",
    bottom: 50,
    width: "80%",
    height: 50,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 20,
    overflow: "hidden",
  },
});
