import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  Platform,
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

const { width, height } = Dimensions.get("window");

const Screens = () => {
  const params = useLocalSearchParams();
  const [decodedUrl, setDecodedUrl] = useState(null);
  const [wallpaperName, setWallpaperName] = useState(null);
  const router = useRouter();

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
        <MaterialIcons name="now-wallpaper" size={24} color="white" />
        <Feather name="heart" size={24} color="white" />
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
