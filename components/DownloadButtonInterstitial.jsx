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
  const [shouldTriggerDownload, setShouldTriggerDownload] = useState(false);
  
  // Use refs to avoid dependency issues
  const pendingShowRef = useRef(false);
  const downloadCallbackRef = useRef(null);

  const adUnitId = 'ca-app-pub-4677981033286236/9404173109';

  const createAndLoadAd = useCallback(() => {
    console.log("Creating interstitial ad...");
    setIsAdLoading(true);
    setAdError(null);
    setShouldTriggerDownload(false);

    const newAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly:
        adRequestOptions.requestNonPersonalizedAdsOnly ?? false,
      keywords: adRequestOptions.keywords ?? ["wallpaper", "art", "design"],
    });

    const unsubscribeLoaded = newAd.addAdEventListener(
      AdEventType.LOADED,
      async () => {
        console.log("Interstitial ad loaded successfully");
        setLoaded(true);
        setCurrentAd(newAd);
        setIsAdLoading(false);
        setAdError(null);

        // If there's a pending show request, show the ad immediately
        if (pendingShowRef.current) {
          console.log("Showing ad immediately after load (was pending)");
          pendingShowRef.current = false;
          try {
            await newAd.show();
          } catch (error) {
            console.error("Error showing pending ad:", error);
            setAdError(error.message);
            setShouldTriggerDownload(true);
          }
        }
      }
    );

    const unsubscribeClosed = newAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log("Interstitial ad closed - triggering download");
        setLoaded(false);
        setCurrentAd(null);
        pendingShowRef.current = false;
        setShouldTriggerDownload(true);
        
        // Call the download callback if it exists
        if (downloadCallbackRef.current) {
          console.log("Calling download callback after ad closed");
          const callback = downloadCallbackRef.current;
          downloadCallbackRef.current = null;
          callback();
        }
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
        pendingShowRef.current = false;
        setShouldTriggerDownload(true);
        
        // Call the download callback on error too
        if (downloadCallbackRef.current) {
          console.log("Calling download callback after ad error");
          const callback = downloadCallbackRef.current;
          downloadCallbackRef.current = null;
          callback();
        }
      }
    );

    newAd.load();

    return () => {
      console.log("Cleaning up interstitial ad listeners...");
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [adUnitId, adRequestOptions]); // Removed pendingShow from dependencies

  const showAdWithCallback = useCallback(async (downloadCallback) => {
    setShouldTriggerDownload(false);
    downloadCallbackRef.current = downloadCallback;
    
    if (loaded && currentAd) {
      try {
        console.log("Showing interstitial ad");
        await currentAd.show();
        return { success: true, showedImmediately: true };
      } catch (error) {
        console.error("Error showing interstitial ad:", error);
        setAdError(error.message);
        setShouldTriggerDownload(true);
        // Call callback immediately on error
        if (downloadCallback) {
          downloadCallback();
          downloadCallbackRef.current = null;
        }
        return { success: false, showedImmediately: false };
      }
    } else if (isAdLoading) {
      // Ad is currently loading, set pending flag
      console.log("Ad is loading, setting pending show");
      pendingShowRef.current = true;
      return { success: true, showedImmediately: false };
    } else {
      // No ad loaded and none loading, try to load one
      console.log("No ad available, creating new ad");
      pendingShowRef.current = true;
      createAndLoadAd();
      return { success: true, showedImmediately: false };
    }
  }, [loaded, currentAd, isAdLoading, createAndLoadAd]);

  const resetAdState = useCallback(() => {
    setLoaded(false);
    setCurrentAd(null);
    setIsAdLoading(false);
    setAdError(null);
    setShouldTriggerDownload(false);
    pendingShowRef.current = false;
    downloadCallbackRef.current = null;
  }, []);

  // Load initial ad
  useEffect(() => {
    const cleanup = createAndLoadAd();
    return cleanup;
  }, [createAndLoadAd]);

  return {
    loaded,
    isAdLoading,
    showAdWithCallback,
    resetAdState,
    createAndLoadAd,
    adError,
    shouldTriggerDownload,
  };
};

const DownloadButtonInterstitial = ({ 
  imageUrl, 
  wallpaperName, 
  adRequestOptions = {},
  vertical = false 
}) => {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [waitingForAd, setWaitingForAd] = useState(false);
  
  const {
    loaded,
    isAdLoading,
    showAdWithCallback,
    resetAdState,
    createAndLoadAd,
    adError,
    shouldTriggerDownload,
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
      setWaitingForAd(false);
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
      resetAdState();
      // Load a new ad for next time
      setTimeout(() => {
        createAndLoadAd();
      }, 1000);
    }
  }, [imageUrl, wallpaperName, downloadStarted, resetAdState, createAndLoadAd]);

  const handlePress = useCallback(async () => {
    if (downloadStarted) {
      console.log("Download in progress, ignoring press");
      return;
    }

    console.log("Download button pressed");
    setWaitingForAd(true);

    // Try to show the ad with download callback
    const result = await showAdWithCallback(handleDownload);
    
    if (result.success) {
      if (result.showedImmediately) {
        console.log("Interstitial ad shown immediately, download will happen after ad closes");
        setWaitingForAd(false);
      } else {
        console.log("Ad will show when ready, keeping loading state");
        // Keep waitingForAd true until ad shows or fails
      }
    } else {
      // Failed to show ad, download should have been called already in the callback
      console.log("Failed to show ad, download should have been triggered");
      setWaitingForAd(false);
    }
  }, [downloadStarted, showAdWithCallback, handleDownload]);

  // Handle when pending ad finally loads and shows
  useEffect(() => {
    if (waitingForAd && loaded && !isAdLoading) {
      console.log("Ad loaded while waiting, should show automatically");
      setWaitingForAd(false);
    }
  }, [waitingForAd, loaded, isAdLoading]);

  // Handle ad errors while waiting
  useEffect(() => {
    if (waitingForAd && adError && !isAdLoading) {
      console.log("Ad error while waiting, proceeding with download");
      setWaitingForAd(false);
      ToastAndroid.show("Loading download...", ToastAndroid.SHORT);
      handleDownload();
    }
  }, [waitingForAd, adError, isAdLoading, handleDownload]);

  // Auto-retry loading ad if it failed
  useEffect(() => {
    if (adError && !loaded && !isAdLoading && !waitingForAd) {
      console.log("Ad failed to load, retrying in 3 seconds...");
      const timer = setTimeout(() => {
        createAndLoadAd();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [adError, loaded, isAdLoading, waitingForAd, createAndLoadAd]);

  // Determine if we should show loading state
  const showLoadingState = downloadStarted || waitingForAd;

  if (vertical) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={showLoadingState}
        style={styles.verticalButton}
      >
        {showLoadingState ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Feather name="download" size={26} color="white" />
        )}
        <Text style={styles.toolbarButtonLabel}>
          {downloadStarted ? "Saving..." : waitingForAd ? "Loading..." : "Save"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={showLoadingState}
      style={styles.downloadButton}
    >
      {showLoadingState ? (
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