import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  Text,
  NativeModules,
} from "react-native";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ConsentManager from "../../components/ConsentManager";
import DownloadButton from "../../components/DownloadButton";

const Screens = () => {
  const params = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [decodedUrl, setDecodedUrl] = useState(null);
  const [wallpaperName, setWallpaperName] = useState(null);
  const router = useRouter();
  const [consentDetermined, setConsentDetermined] = useState(false);
  const [personalizedAdsAllowed, setPersonalizedAdsAllowed] = useState(false);

  // Function to handle consent determination
  const handleConsentDetermined = (consentGiven) => {
    setConsentDetermined(true);
    setPersonalizedAdsAllowed(consentGiven);
    console.log(
      `User consent for personalized ads: ${
        consentGiven ? "Granted" : "Denied"
      }`
    );
  };

  useEffect(() => {
    checkFavorite();
  }, [decodedUrl]);

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
      console.log("Current favorites:", favorites);
      const favoritesArray = favorites ? JSON.parse(favorites) : [];

      if (isFavorite) {
        const newFavorites = favoritesArray.filter(
          (fav) => fav.imageUrl !== decodedUrl
        );
        await AsyncStorage.setItem("favorites", JSON.stringify(newFavorites));
        console.log("Updated favorites (removed):", newFavorites);
        setIsFavorite(false);
        Alert.alert("Removed from favorites");
      } else {
        const newFavorite = {
          imageUrl: decodedUrl,
          name: wallpaperName,
          addedAt: new Date().toISOString(),
        };
        const newFavorites = [...favoritesArray, newFavorite];
        await AsyncStorage.setItem("favorites", JSON.stringify(newFavorites));
        console.log("Updated favorites (added):", newFavorites);
        setIsFavorite(true);
        Alert.alert("Added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorites");
    }
  };

  const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  };

  const getFileExtension = (url) => {
    const urlExtension = url.split(".").pop().split(/[#?]/)[0];
    const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

    if (validExtensions.includes(urlExtension.toLowerCase())) {
      return urlExtension.toLowerCase();
    }
    return "png";
  };

  const setWallpaper = async () => {
    if (!decodedUrl) return;

    try {
      const filename = `temp_wallpaper_${Date.now()}.${getFileExtension(
        decodedUrl
      )}`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const { uri } = await FileSystem.downloadAsync(decodedUrl, fileUri);

      Alert.alert(
        "Set Wallpaper",
        "Where would you like to set this wallpaper?",
        [
          {
            text: "Home Screen",
            onPress: () => {
              NativeModules.WallPaperManager.setWallpaper(
                { uri, screen: "home" },
                (res) => {
                  if (res === "success") {
                    Alert.alert("Success", "Wallpaper set as home screen!");
                  } else {
                    Alert.alert("Error", "Failed to set wallpaper");
                  }
                  FileSystem.deleteAsync(fileUri);
                }
              );
            },
          },
          {
            text: "Lock Screen",
            onPress: () => {
              NativeModules.WallPaperManager.setWallpaper(
                { uri, screen: "lock" },
                (res) => {
                  if (res === "success") {
                    Alert.alert("Success", "Wallpaper set as lock screen!");
                  } else {
                    Alert.alert("Error", "Failed to set wallpaper");
                  }
                  FileSystem.deleteAsync(fileUri);
                }
              );
            },
          },
          {
            text: "Both",
            onPress: () => {
              NativeModules.WallPaperManager.setWallpaper(
                { uri, screen: "both" },
                (res) => {
                  if (res === "success") {
                    Alert.alert("Success", "Wallpaper set on both screens!");
                  } else {
                    Alert.alert("Error", "Failed to set wallpaper");
                  }
                  FileSystem.deleteAsync(fileUri);
                }
              );
            },
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              FileSystem.deleteAsync(fileUri);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Wallpaper setup error:", error);
      Alert.alert("Error", "Failed to prepare wallpaper");
    }
  };

  // Function to pass personalization options to DownloadButton
  const getAdRequestOptions = () => {
    return {
      requestNonPersonalizedAdsOnly: !personalizedAdsAllowed,
      keywords: ["wallpaper", "art", "design"],
    };
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

      {/* Header with Back Button and Title */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backbutton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back-outline" size={24} color="white" />
        </TouchableOpacity>

        {wallpaperName && (
          <Text numberOfLines={1} style={styles.wallpaperTitle}>
            {wallpaperName}
          </Text>
        )}

        <View style={styles.empty} />
      </View>

      <ConsentManager onConsentDetermined={handleConsentDetermined} />

      <View intensity={100} tint="dark" style={styles.toolbar}>
        <DownloadButton
          imageUrl={decodedUrl}
          wallpaperName={wallpaperName}
          adRequestOptions={getAdRequestOptions()}
        />
        <TouchableOpacity onPress={toggleFavorite}>
          <AntDesign
            name={isFavorite ? "heart" : "hearto"}
            size={24}
            color={isFavorite ? "#ff4757" : "white"}
          />
        </TouchableOpacity>
      </View>
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
    flex: 1,
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 10,
    width: "100%",
  },
  backbutton: {
    marginLeft: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    height: 40,
    width: 40,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    marginLeft: 10,
    backgroundColor: "rgba(0,0,0,0)",
    height: 40,
    width: 40,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  wallpaperTitle: {
    fontFamily: "Outfit-Bold",
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 10,
    textShadowColor: "rgba(0,0,0,0)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  toolbar: {
    position: "absolute",
    bottom: 50,
    width: "60%",
    height: 50,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  // Rest of your styles remain the same
});
