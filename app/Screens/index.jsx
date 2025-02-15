import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  Linking,
  NativeModules,
  ActivityIndicator,
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
  : "ca-app-pub-4677981033286236/7236677981";

const Screens = () => {
  const params = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [decodedUrl, setDecodedUrl] = useState(null);
  const [wallpaperName, setWallpaperName] = useState(null);
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [isRewarded, setIsRewarded] = useState(false);
  const [adInstance, setAdInstance] = useState(null);
  const [downloadPending, setDownloadPending] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [isAdLoading, setIsAdLoading] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [decodedUrl]);

  // Initialize ad on component mount
  useEffect(() => {
    const createAndLoadAd = () => {
      const newAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ["wallpaper", "art", "design"],
      });

      const unsubscribeLoaded = newAd.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          console.log("Ad loaded successfully");
          setLoaded(true);
          setCurrentAd(newAd);
        }
      );

      const unsubscribeEarned = newAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          console.log("User earned reward");
          setIsRewarded(true);
          setDownloadPending(true); // Set download pending when reward is earned
        }
      );

      const unsubscribeClosed = newAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log("Ad closed");
          setLoaded(false);
          setCurrentAd(null);
          // Load new ad immediately
          createAndLoadAd();
        }
      );

      newAd.load();

      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeClosed();
      };
    };

    const cleanup = createAndLoadAd();
    return cleanup;
  }, []);

  // Handle download when reward is earned
  useEffect(() => {
    const performDownload = async () => {
      if (isRewarded && downloadPending && decodedUrl) {
        try {
          const extension = getFileExtension(decodedUrl);
          const baseFileName = wallpaperName
            ? sanitizeFileName(wallpaperName)
            : "wallpaper_" + new Date().getTime();
          const filename = `${baseFileName}.${extension}`;

          console.log("Starting download for:", filename);

          const directory = `${FileSystem.documentDirectory}HorizonWalls/`;
          await FileSystem.makeDirectoryAsync(directory, {
            intermediates: true,
          });

          const fileUri = `${directory}${filename}`;

          console.log("Downloading from:", decodedUrl);
          const { uri } = await FileSystem.downloadAsync(decodedUrl, fileUri);
          await MediaLibrary.saveToLibraryAsync(uri);

          Alert.alert(
            "Download Complete",
            `Wallpaper saved in the "HorizonWalls" folder!`
          );

          console.log("Successfully saved at:", uri);
        } catch (error) {
          console.error("Download error:", error);
          Alert.alert("Error", "Failed to download image.");
        } finally {
          setIsRewarded(false);
          setDownloadPending(false);
        }
      }
    };

    performDownload();
  }, [isRewarded, downloadPending, decodedUrl, wallpaperName]); // Empty dependency array since we want this only on mount

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

  useEffect(() => {
    if (params.imageUrl) {
      const decoded = decodeURIComponent(params.imageUrl);
      setDecodedUrl(decoded);
      setIsRewarded(false);
      setDownloadPending(false);

      if (adInstance) {
        adInstance.load();
      }
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
    // If ad is already loaded, show it immediately
    if (loaded && currentAd) {
      try {
        await currentAd.show();
      } catch (error) {
        console.error("Error showing ad:", error);
        Alert.alert("Error", "Failed to show ad. Please try again.");
        setLoaded(false);
        setCurrentAd(null);
        setIsAdLoading(false);
      }
      return;
    }

    // If no ad is loaded, start loading process
    setIsAdLoading(true);

    const newAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ["wallpaper", "art", "design"],
    });

    try {
      // Set up event listeners
      const loadPromise = new Promise((resolve, reject) => {
        const unsubscribe = newAd.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            console.log("Ad loaded successfully");
            unsubscribe();
            resolve();
          }
        );

        // Add error handling
        const unsubscribeError = newAd.addAdEventListener(
          RewardedAdEventType.FAILED_TO_LOAD,
          (error) => {
            console.error("Ad failed to load:", error);
            unsubscribeError();
            reject(new Error("Failed to load ad"));
          }
        );

        // Start loading the ad
        newAd.load();
      });

      // Wait for ad to load
      await loadPromise;

      setLoaded(true);
      setCurrentAd(newAd);
      setIsAdLoading(false);

      // Show ad
      await newAd.show();
    } catch (error) {
      console.error("Error in ad flow:", error);
      Alert.alert("Error", "Failed to load or show ad. Please try again.");
      setLoaded(false);
      setCurrentAd(null);
      setIsAdLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!decodedUrl) {
      console.log("No URL available for download");
      return;
    }

    try {
      const extension = getFileExtension(decodedUrl);
      const baseFileName = wallpaperName
        ? sanitizeFileName(wallpaperName)
        : "wallpaper_" + new Date().getTime();
      const filename = `${baseFileName}.${extension}`;

      console.log("Starting download for:", filename);

      const directory = `${FileSystem.documentDirectory}HorizonWalls/`;
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

      const fileUri = `${directory}${filename}`;

      console.log("Downloading from:", decodedUrl);
      const { uri } = await FileSystem.downloadAsync(decodedUrl, fileUri);
      await MediaLibrary.saveToLibraryAsync(uri);

      Alert.alert(
        "Download Complete",
        `Wallpaper saved in the "HorizonWalls" folder!`
      );

      console.log("Successfully saved at:", uri);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to download image.");
    } finally {
      setIsRewarded(false);
      setDownloadPending(false);
    }
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

      <BlurView intensity={100} tint="dark" style={styles.toolbar}>
        <TouchableOpacity onPress={downloadImage} disabled={isAdLoading}>
          {isAdLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Feather name="download" size={24} color="white" />
          )}
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={setWallpaper}>
          <MaterialIcons name="now-wallpaper" size={24} color="white" />
        </TouchableOpacity> */}
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
    width: "60%",
    height: 50,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 20,
    overflow: "hidden",
  },
});
