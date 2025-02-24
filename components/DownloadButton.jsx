import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ToastAndroid,
} from "react-native";
import {
  RewardedAd,
  TestIds,
  AdEventType,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Feather } from "@expo/vector-icons";

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

  // Use test ID for both dev and production temporarily to debug
  const adUnitIdd = __DEV__
    ? TestIds.REWARDED
    : "ca-app-pub-4677981033286236/7236677981";
  const adUnitId = TestIds.REWARDED;
  // Log current environment
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
      keywords: ["wallpaper", "art", "design"],
    });

    const unsubscribeLoaded = newAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log("Ad loaded successfully");
        setLoaded(true);
        setCurrentAd(newAd);
        setIsAdLoading(false);
        setAdError(null);

        if (downloadPending) {
          console.log("Attempting to show ad due to pending download...");
          newAd.show().catch((error) => {
            console.error("Error showing ad:", error);
            setIsAdLoading(false);
            setDownloadPending(false);
            setAdError(error.message);
            Alert.alert(
              "Ad Error",
              "Failed to show advertisement. Please try again."
            );
          });
        }
      }
    );

    const unsubscribeEarned = newAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log("Reward earned:", reward);
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
        if (shouldLoadNewAd) {
          console.log("Creating new ad after close...");
          createAndLoadAd();
        }
      }
    );

    const unsubscribeError = newAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error("Detailed ad error:", {
          message: error.message,
          code: error.code,
          domain: error.domain,
        });

        setAdError(error.message);
        setIsAdLoading(false);
        setDownloadPending(false);
        setLoaded(false);

        // Proceed with download when there's an ad error
        setIsRewarded(true);
        setDownloadPending(true);

        ToastAndroid.show(
          "Ad failed to load, proceeding with download",
          ToastAndroid.SHORT
        );
      }
    );

    console.log("Loading ad...");
    newAd.load();

    return () => {
      console.log("Cleaning up ad listeners...");
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [adUnitId, downloadPending, shouldLoadNewAd]);

  const resetAdState = useCallback(() => {
    setLoaded(false);
    setIsRewarded(false);
    setCurrentAd(null);
    setIsAdLoading(false);
    setDownloadPending(false);
    setShouldLoadNewAd(true);
  }, []);

  const showAd = useCallback(async () => {
    if (loaded && currentAd) {
      try {
        await currentAd.show();
      } catch (error) {
        console.error("Error showing ad:", error);
        resetAdState();
        createAndLoadAd();
      }
      return;
    }

    setIsAdLoading(true);
    setDownloadPending(true);

    try {
      const newAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ["wallpaper", "art", "design"],
      });

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Ad loading timed out"));
        }, 8000);
      });

      // Create the ad loading promise
      const adLoadingPromise = new Promise((resolve, reject) => {
        const unsubscribeLoaded = newAd.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            console.log("Ad loaded successfully");
            setLoaded(true);
            setCurrentAd(newAd);
            setIsAdLoading(false);
            setAdError(null);
            resolve(newAd); // Resolve with the ad instance
          }
        );

        const unsubscribeError = newAd.addAdEventListener(
          AdEventType.ERROR,
          (error) => {
            console.error("Ad failed to load:", error);
            unsubscribeError();
            unsubscribeLoaded();
            reject(error);
          }
        );

        newAd.load();
      });

      // Wait for either the ad to load or timeout
      const loadedAd = await Promise.race([adLoadingPromise, timeoutPromise]);

      // Show the ad only if we have a valid instance
      if (loadedAd) {
        await loadedAd.show();
      }
    } catch (error) {
      console.log("Error in ad flow:", error);
      // Proceed with download if ad fails
      setIsRewarded(true);
      setDownloadPending(true);
      setIsAdLoading(false);
      ToastAndroid.show(
        "Ad failed to load, downloading wallpaper...",
        ToastAndroid.SHORT
      );
    }
  }, [loaded, currentAd, adUnitId, createAndLoadAd, resetAdState]);

  useEffect(() => {
    const cleanup = createAndLoadAd();
    return cleanup;
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
          // ✅ Android 12+ (API 31+) - Save directly without permission
          await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
          ToastAndroid.show(
            "Wallpaper saved successfully!",
            ToastAndroid.SHORT
          );
        } else {
          // 🔹 Android 11 and below - Request permission first
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === "granted") {
            await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
            ToastAndroid.show(
              "Wallpaper saved successfully!",
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
        // iOS - Just save without asking (since permission is handled automatically)
        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
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

  return (
    <TouchableOpacity
      onPress={showAd}
      disabled={isAdLoading || downloadStarted}
      style={styles.downloadButton}
    >
      {isAdLoading || downloadStarted ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Feather name="download" size={24} color="white" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  downloadButton: {
    padding: 10,
  },
});

export default DownloadButton;
