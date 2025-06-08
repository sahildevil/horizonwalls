import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  ActivityIndicator,
  ToastAndroid,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Feather } from "@expo/vector-icons";
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import * as MediaLibrary from "expo-media-library";

// Utility functions
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

const useInterstitialAd = (adRequestOptions = {}) => {
  const [loaded, setLoaded] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [adError, setAdError] = useState(null);

  // Use your production ad unit ID for interstitial ads
  // const adUnitId = __DEV__
  //   ? TestIds.INTERSTITIAL
  //   : "ca-app-pub-4677981033286236/9404173109"; // Replace with your actual interstitial ad unit ID
  const adUnitId = TestIds.INTERSTITIAL;
  const createAndLoadAd = useCallback(() => {
    console.log("Creating interstitial ad...");
    setIsAdLoading(true);
    setAdError(null);

    const newAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly:
        adRequestOptions.requestNonPersonalizedAdsOnly ?? false,
      keywords: adRequestOptions.keywords ?? ["wallpaper", "art", "design"],
    });

    const unsubscribeLoaded = newAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log("Interstitial ad loaded successfully");
        setLoaded(true);
        setCurrentAd(newAd);
        setIsAdLoading(false);
        setAdError(null);
      }
    );

    const unsubscribeClosed = newAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log("Interstitial ad closed");
        setLoaded(false);
        setCurrentAd(null);
        // Don't automatically create a new ad after closing
      }
    );

    const unsubscribeError = newAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error("Interstitial ad error:", error);
        setAdError(error.message);
        setIsAdLoading(false);
        setLoaded(false);
        setCurrentAd(null);
      }
    );

    newAd.load();

    return () => {
      console.log("Cleaning up interstitial ad listeners...");
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [adUnitId, adRequestOptions]);

  const showAd = useCallback(async () => {
    if (loaded && currentAd) {
      try {
        console.log("Showing interstitial ad");
        await currentAd.show();
        return true; // Ad shown successfully
      } catch (error) {
        console.error("Error showing interstitial ad:", error);
        setAdError(error.message);
        return false; // Failed to show ad
      }
    } else {
      console.log("No interstitial ad loaded");
      return false; // No ad to show
    }
  }, [loaded, currentAd]);

  const resetAdState = useCallback(() => {
    setLoaded(false);
    setCurrentAd(null);
    setIsAdLoading(false);
    setAdError(null);
  }, []);

  // Load initial ad
  useEffect(() => {
    const cleanup = createAndLoadAd();
    return cleanup;
  }, [createAndLoadAd]);

  return {
    loaded,
    isAdLoading,
    showAd,
    resetAdState,
    createAndLoadAd,
    adError,
  };
};

const DownloadButtonInterstitial = ({ 
  imageUrl, 
  wallpaperName, 
  adRequestOptions = {},
  vertical = false 
}) => {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [adShown, setAdShown] = useState(false);
  
  const {
    loaded,
    isAdLoading,
    showAd,
    resetAdState,
    createAndLoadAd,
    adError,
  } = useInterstitialAd(adRequestOptions);

  const handleDownload = useCallback(async () => {
    if (!imageUrl) {
      console.log("No URL available for download");
      Alert.alert("Error", "No image URL available for download");
      return;
    }

    if (downloadStarted) {
      console.log("Download already in progress");
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

      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

      if (Platform.OS === "android") {
        if (Platform.Version >= 31) {
          await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
          ToastAndroid.show(
            "Wallpaper saved successfully!",
            ToastAndroid.SHORT
          );
        } else {
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
        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
      }

      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert(
        "Download Failed",
        "There was an error downloading the wallpaper"
      );
    } finally {
      setDownloadStarted(false);
      setAdShown(false);
      resetAdState();
      // Load a new ad for next time
      setTimeout(() => {
        createAndLoadAd();
      }, 1000);
    }
  }, [imageUrl, wallpaperName, downloadStarted, resetAdState, createAndLoadAd]);

  const handlePress = useCallback(async () => {
    if (downloadStarted || isAdLoading) {
      console.log("Download or ad loading in progress, ignoring press");
      return;
    }

    console.log("Download button pressed");

    // Try to show the ad first
    const adWasShown = await showAd();
    
    if (adWasShown) {
      console.log("Interstitial ad shown, will download after ad closes");
      setAdShown(true);
      // Download will be triggered when ad closes (handled in useEffect below)
    } else {
      // No ad available or failed to show, proceed with download immediately
      console.log("No ad available or failed to show, proceeding with download");
      if (adError) {
        console.log("Ad error occurred:", adError);
        ToastAndroid.show("Loading download...", ToastAndroid.SHORT);
      }
      handleDownload();
    }
  }, [downloadStarted, isAdLoading, showAd, handleDownload, adError]);

  // Handle download after ad is closed
  useEffect(() => {
    if (adShown && !loaded && !downloadStarted) {
      console.log("Ad was closed, starting download");
      handleDownload();
    }
  }, [adShown, loaded, downloadStarted, handleDownload]);

  // Auto-retry loading ad if it failed
  useEffect(() => {
    if (adError && !loaded && !isAdLoading) {
      console.log("Ad failed to load, retrying in 2 seconds...");
      const timer = setTimeout(() => {
        createAndLoadAd();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [adError, loaded, isAdLoading, createAndLoadAd]);

  if (vertical) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={downloadStarted}
        style={styles.verticalButton}
      >
        {downloadStarted ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Feather name="download" size={26} color="white" />
        )}
        <Text style={styles.toolbarButtonLabel}>
          {downloadStarted ? "Saving..." : "Save"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={downloadStarted}
      style={styles.downloadButton}
    >
      {downloadStarted ? (
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
  verticalButton: {
    alignItems: "center",
    marginBottom: 20,
  },
  toolbarButtonLabel: {
    color: "white",
    fontSize: 12,
    marginTop: 5,
    fontFamily: "Outfit-Medium",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
});

export default DownloadButtonInterstitial;