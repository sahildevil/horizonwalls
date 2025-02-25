import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ToastAndroid,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Feather } from "@expo/vector-icons";
import {
  RewardedAd,
  TestIds,
  AdEventType,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";
import CustomAlert from "./CustomAlert";

// Utility functions remain the same
const sanitizeFileName = (name) => {
  return name?.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() || "";
};

const getFileExtension = (url) => {
  const urlExtension = url?.split(".")?.pop()?.split(/[#?]/)[0];
  const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

  if (validExtensions.includes(urlExtension?.toLowerCase())) {
    return urlExtension.toLowerCase();
  }
  return "png";
};

const useRewardedAd = () => {
  const [loaded, setLoaded] = useState(false);
  const [isRewarded, setIsRewarded] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [downloadPending, setDownloadPending] = useState(false);
  const [shouldLoadNewAd, setShouldLoadNewAd] = useState(true);
  const [adError, setAdError] = useState(null);

  const adUnitId = __DEV__
    ? TestIds.REWARDED
    : "ca-app-pub-4677981033286236/7236677981";

  useEffect(() => {
    console.log("Current environment:", __DEV__ ? "Development" : "Production");
    console.log("Platform:", Platform.OS);
    console.log("Using ad unit ID:", adUnitId);
  }, []);

  const createAndLoadAd = useCallback(() => {
    if (!shouldLoadNewAd) return () => {};

    console.log("Creating new ad request...");

    const newAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
      keywords: [
        "wallpaper",
        "art",
        "design",
        "photography",
        "illustration",
        "backgrounds",
        "aesthetic",
        "nature",
        "abstract",
        "patterns",
      ],
    });

    const unsubscribeLoaded = newAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log("Ad loaded successfully");
        setLoaded(true);
        setCurrentAd(newAd);
        setIsAdLoading(false);
        setAdError(null);
      }
    );

    const unsubscribeEarned = newAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        console.log("User earned reward");
        setIsRewarded(true);
        setDownloadPending(true);
        setShouldLoadNewAd(false);
      }
    );

    const unsubscribeClosed = newAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log("Ad closed");
        setLoaded(false);
        setCurrentAd(null);
        // Don't create new ad here
      }
    );

    const unsubscribeError = newAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log("Ad error:", error);
        setAdError(error.message);
        setIsAdLoading(false);
        setLoaded(false);
        setIsRewarded(true);
        setDownloadPending(true);
        setShouldLoadNewAd(false);
        ToastAndroid.show("Processing download...", ToastAndroid.SHORT);
      }
    );

    console.log("Loading ad...");
    newAd.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [adUnitId, shouldLoadNewAd]);

  const resetAdState = useCallback(() => {
    setLoaded(false);
    setIsRewarded(false);
    setCurrentAd(null);
    setIsAdLoading(false);
    setDownloadPending(false);
    setShouldLoadNewAd(true);
  }, []);

  const showAd = useCallback(async () => {
    if (isAdLoading) {
      console.log("Ad is already loading");
      return;
    }

    setIsAdLoading(true);
    setDownloadPending(true);

    const timeoutId = setTimeout(() => {
      if (!loaded) {
        console.log("Ad load timeout");
        setIsRewarded(true);
        setDownloadPending(true);
        setIsAdLoading(false);
        setShouldLoadNewAd(false);
        ToastAndroid.show(
          "Ad taking too long, processing download...",
          ToastAndroid.SHORT
        );
      }
    }, 7000);

    try {
      if (loaded && currentAd) {
        clearTimeout(timeoutId);
        await currentAd.show();
      } else {
        createAndLoadAd();
      }
    } catch (error) {
      console.error("Error showing ad:", error);
      clearTimeout(timeoutId);
      setIsRewarded(true);
      setDownloadPending(true);
      setIsAdLoading(false);
      setShouldLoadNewAd(false);
    }
  }, [loaded, currentAd, createAndLoadAd, isAdLoading]);

  // Preload ad when component mounts
  useEffect(() => {
    const cleanup = createAndLoadAd();
    return () => {
      cleanup();
      setCurrentAd(null);
      setLoaded(false);
    };
  }, [createAndLoadAd]);

  return {
    loaded,
    isRewarded,
    isAdLoading,
    downloadPending,
    showAd,
    setIsRewarded,
    setDownloadPending,
    resetAdState,
    adError,
  };
};

const DownloadButton = ({ imageUrl, wallpaperName }) => {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const {
    isAdLoading,
    showAd,
    isRewarded,
    downloadPending,
    setIsRewarded,
    setDownloadPending,
    resetAdState,
  } = useRewardedAd();

  const handleDownload = async () => {
    if (!imageUrl) {
      console.log("No URL available for download");
      Alert.alert("Error", "No image URL available for download");
      return;
    }

    try {
      setDownloadStarted(true);
      console.log("Starting download process...");

      const extension = getFileExtension(imageUrl);
      const baseFileName = wallpaperName
        ? sanitizeFileName(wallpaperName)
        : "wallpaper_" + new Date().getTime();
      const filename = `${baseFileName}.${extension}`;

      // Download to cache directory first
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

      if (Platform.OS === "android") {
        if (Platform.Version >= 31) {
          const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
          //          let album = await MediaLibrary.getAlbumAsync("HorizonWalls");
          await MediaLibrary.createAlbumAsync("HorizonWalls", asset, false);

          ToastAndroid.show(
            "Wallpaper saved in HorizonWalls folder!",
            ToastAndroid.SHORT
          );
        } else {
          // 🔹 Android 11 and below - Request permission first
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === "granted") {
            const asset = await MediaLibrary.createAssetAsync(
              downloadResult.uri
            );
            let album = await MediaLibrary.getAlbumAsync("HorizonWalls");

            if (album === null) {
              await MediaLibrary.createAlbumAsync("HorizonWalls", asset, false);
            } else {
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }

            ToastAndroid.show(
              "Wallpaper saved in HorizonWalls folder!",
              ToastAndroid.SHORT
            );
          } else {
            Alert.alert(
              "Permission needed",
              "Please allow storage permission to save wallpapers"
            );
          }
        }
      } else {
        // iOS - Save to HorizonWalls album
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        let album = await MediaLibrary.getAlbumAsync("HorizonWalls");

        if (album === null) {
          await MediaLibrary.createAlbumAsync("HorizonWalls", asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      }

      // Clean up the cached file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert(
        "Download Failed",
        "There was an error downloading the wallpaper"
      );
    } finally {
      // ✅ Ensure UI updates correctly
      setDownloadStarted(false);
      setIsRewarded(false);
      setDownloadPending(false);
      resetAdState();
    }
  };

  useEffect(() => {
    if (isRewarded && downloadPending && !downloadStarted) {
      console.log("Starting download after reward...");
      handleDownload();
    }
  }, [isRewarded, downloadPending, downloadStarted, imageUrl, wallpaperName]);

  const handlePress = () => {
    setShowAlert(true);
  };

  const handleConfirm = () => {
    setShowAlert(false);
    showAd();
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        disabled={isAdLoading || downloadStarted}
        style={styles.downloadButton}
      >
        {isAdLoading || downloadStarted ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Feather name="download" size={24} color="white" />
        )}
      </TouchableOpacity>

      <CustomAlert
        visible={showAlert}
        onClose={() => setShowAlert(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};

const styles = StyleSheet.create({
  downloadButton: {
    padding: 10,
  },
});

export default DownloadButton;
