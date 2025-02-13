import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  Linking,
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
import {
  RewardedAd,
  TestIds,
  AdEventType,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";

const adUnitId = __DEV__
  ? TestIds.REWARDED
  : "ca-app-pub-4677981033286236~5504793911";

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
  keywords: ["wallpaper", "art", "design"],
});

const Screens = () => {
  const params = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [decodedUrl, setDecodedUrl] = useState(null);
  const [wallpaperName, setWallpaperName] = useState(null);
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [isRewarded, setIsRewarded] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [decodedUrl]);

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setLoaded(true);
      }
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log("User earned reward:", reward);
        setIsRewarded(true);
      }
    );

    const unsubscribeClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log("Ad closed");
        if (isRewarded) {
          handleDownload(); // ✅ Download wallpaper when ad is closed
          setIsRewarded(false); // Reset reward state
        }
        setLoaded(false);
        rewarded.load();
      }
    );

    const unsubscribeFailedToLoad = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error("Ad failed to load:", error);
        setLoaded(false);
      }
    );

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeFailedToLoad();
    };
  }, [isRewarded]); // ✅ Add `isRewarded` as a dependency

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
        const newFavorites = favoritesArray.filter(
          (fav) => fav.imageUrl !== decodedUrl
        );
        await AsyncStorage.setItem("favorites", JSON.stringify(newFavorites));
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

  const downloadImage = async () => {
    if (!loaded) {
      Alert.alert("Ad not ready", "Please wait a moment and try again.", [
        { text: "OK" },
      ]);
      return;
    }

    try {
      await rewarded.show();
    } catch (error) {
      console.error("Error showing ad:", error);
      Alert.alert("Error", "Failed to show ad. Please try again.");
    }
  };

  const handleDownload = async () => {
    if (!decodedUrl || !isRewarded) return;

    try {
      const extension = getFileExtension(decodedUrl);
      const baseFileName = wallpaperName
        ? sanitizeFileName(wallpaperName)
        : "wallpaper_" + new Date().getTime();
      const filename = `${baseFileName}.${extension}`;

      console.log("Saving as:", filename);

      // Define the final file path directly inside the "HorizonWalls" album
      const directory = `${FileSystem.documentDirectory}HorizonWalls/`;
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

      const fileUri = `${directory}${filename}`;

      // Download image directly with correct name
      const { uri } = await FileSystem.downloadAsync(decodedUrl, fileUri);

      // Save directly to Media Library
      await MediaLibrary.saveToLibraryAsync(uri);

      Alert.alert(
        "Download Complete",
        `Wallpaper saved in the "HorizonWalls" folder!`
      );

      console.log("Saved at:", uri);
      setIsRewarded(false); // Reset reward state
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to download image.");
      setIsRewarded(false);
    }
  };

  const setWallpaper = async () => {
    if (!decodedUrl) return;

    try {
      if (Platform.OS === "android") {
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (permission !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Please grant storage permission to set wallpaper."
          );
          return;
        }
      }

      const filename = `temp_wallpaper_${Date.now()}.${getFileExtension(
        decodedUrl
      )}`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      const { uri } = await FileSystem.downloadAsync(decodedUrl, fileUri);

      const asset = await MediaLibrary.createAssetAsync(uri);

      try {
        const album = await MediaLibrary.getAlbumAsync("HorizonWalls");
        if (album === null) {
          await MediaLibrary.createAlbumAsync("HorizonWalls", asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        Alert.alert(
          "Wallpaper Downloaded",
          "The image has been saved to your gallery. Would you like to set it as wallpaper?",
          [
            {
              text: "Set Wallpaper",
              onPress: async () => {
                if (Platform.OS === "android") {
                  try {
                    await Linking.sendIntent(
                      "android.intent.action.SET_WALLPAPER"
                    );
                  } catch (error) {
                    console.error("Failed to open wallpaper settings:", error);
                    Alert.alert(
                      "Manual Setup Required",
                      "Please go to your device settings to set the wallpaper."
                    );
                  }
                } else {
                  Alert.alert(
                    "Set Wallpaper",
                    "Please go to your device settings to set the wallpaper."
                  );
                }
              },
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      } catch (error) {
        console.error("Album error:", error);
        Alert.alert("Error", "Failed to save wallpaper");
      }

      await FileSystem.deleteAsync(fileUri);
    } catch (error) {
      console.error("Wallpaper setup error:", error);
      Alert.alert("Error", "Failed to prepare wallpaper");
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
    flex: 1,
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
