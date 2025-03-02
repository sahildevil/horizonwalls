import React, { useEffect, useState, useCallback, useRef } from "react";
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

const useRewardedAd = (
  adRequestOptions = {},
  onAdError = null,
  onAdLoaded = null
) => {
  const [loaded, setLoaded] = useState(false);
  const [isRewarded, setIsRewarded] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [downloadPending, setDownloadPending] = useState(false);
  const [shouldLoadNewAd, setShouldLoadNewAd] = useState(true);
  const [adError, setAdError] = useState(null);
  const adCreated = useRef(false);
  const adUnitId = __DEV__
    ? TestIds.REWARDED
    : "ca-app-pub-4677981033286236/7236677981";
  const adUnitIdd = "ca-app-pub-4677981033286236/7236677981";

  useEffect(() => {
    console.log("Current environment:", __DEV__ ? "Development" : "Production");
    console.log("Platform:", Platform.OS);
    console.log("Using ad unit ID:", adUnitId);
  }, []);

  const createAndLoadAd = useCallback(() => {
    if (!shouldLoadNewAd) return () => {};

    console.log("Creating new ad request...");

    const newAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly:
        adRequestOptions.requestNonPersonalizedAdsOnly ?? false,
      keywords: adRequestOptions.keywords ?? ["wallpaper", "art", "design"],
    });

    const unsubscribeLoaded = newAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log("Ad loaded successfully");
        setLoaded(true);
        setCurrentAd(newAd);
        setIsAdLoading(false);
        setAdError(null);
        adCreated.current = true;

        // Call the onAdLoaded callback if provided
        if (onAdLoaded && typeof onAdLoaded === "function") {
          onAdLoaded(newAd);
        }

        if (downloadPending) {
          console.log("Attempting to show ad due to pending download...");
          try {
            newAd.show().catch((error) => {
              console.error("Error showing ad:", error);
              setIsAdLoading(false);
              setDownloadPending(false);
              setAdError(error.message);

              // Call external error handler if provided
              if (onAdError) {
                onAdError(error);
              }

              Alert.alert(
                "Ad Error",
                "Failed to show advertisement. Please try again."
              );
            });
          } catch (error) {
            console.error("Exception while showing ad:", error);
            if (onAdError) {
              onAdError(error);
            }
          }
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
        console.log("Detailed ad error:", {
          message: error.message,
          code: error.code,
          domain: error.domain,
        });

        setAdError(error.message);
        setIsAdLoading(false);

        // Call external error handler immediately
        if (onAdError) {
          console.log("Calling external error handler for ad error");
          onAdError(error);
        }

        // Trigger download on any ad error
        if (downloadPending) {
          console.log(
            `Ad error occurred (${error.code}), proceeding with download`
          );
          setIsRewarded(true);
        } else {
          setDownloadPending(false);
          setLoaded(false);
        }
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
  }, [
    adUnitId,
    downloadPending,
    shouldLoadNewAd,
    adRequestOptions,
    onAdError,
    onAdLoaded,
  ]);

  const resetAdState = useCallback(() => {
    setLoaded(false);
    setIsRewarded(false);
    setCurrentAd(null);
    setIsAdLoading(false);
    setDownloadPending(false);
    setShouldLoadNewAd(true);
    setAdError(null);
  }, []);

  const showAd = useCallback(async () => {
    if (loaded && currentAd) {
      try {
        console.log("Showing already loaded ad");
        await currentAd.show();
      } catch (error) {
        console.error("Error showing ad:", error);

        // Call external error handler if provided
        if (onAdError) {
          onAdError(error);
        }

        // If ad shows fails but download is pending, proceed with download
        if (downloadPending) {
          console.log("Error showing ad, proceeding with download");
          setIsRewarded(true); // This will trigger download
        } else {
          resetAdState();
          createAndLoadAd();
        }
      }
      return;
    }

    console.log("No preloaded ad available, creating new ad request");
    setIsAdLoading(true);
    setDownloadPending(true);
    createAndLoadAd();
  }, [
    loaded,
    currentAd,
    createAndLoadAd,
    resetAdState,
    downloadPending,
    onAdError,
  ]);

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
    setIsAdLoading,
    createAndLoadAd,
    currentAd, // Add this to expose the currentAd
  };
};

const DownloadButton = ({
  imageUrl,
  wallpaperName,
  adRequestOptions = {},
  preloadedAd = null,
  setPreloadedAd,
  isPreloadedAdLoaded = false,
  onAdClosed,
}) => {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [adTimeout, setAdTimeout] = useState(null);
  const pendingDownloadRef = useRef(false);
  const imageUrlRef = useRef(imageUrl); // Add this to track the current imageUrl

  // Update ref when props change
  useEffect(() => {
    imageUrlRef.current = imageUrl;
  }, [imageUrl]);

  // Handler for ad errors that will directly trigger download
  const handleAdError = useCallback(
    (error) => {
      console.log("Ad error handler triggered:", error.message);
      if (pendingDownloadRef.current && !downloadStarted) {
        console.log("Starting download immediately due to ad error");

        // Clear any existing timeout
        if (adTimeout) {
          clearTimeout(adTimeout);
          setAdTimeout(null);
        }

        // Make sure we're not already downloading
        if (!downloadStarted) {
          // Trigger download directly - with a small delay to ensure state is settled
          setTimeout(() => {
            handleDownload();
          }, 50);
        }
      }
    },
    [downloadStarted, adTimeout]
  );

  const handleAdLoaded = useCallback(
    (newAd) => {
      console.log("Ad loaded callback triggered");

      // Clear timeout when ad loads
      if (adTimeout) {
        console.log("Clearing ad timeout due to successful load");
        clearTimeout(adTimeout);
        setAdTimeout(null);
      }

      // If download is pending, show the ad
      if (pendingDownloadRef.current && !downloadStarted) {
        console.log("Showing ad immediately after load");
        try {
          newAd.show().catch((error) => {
            console.error("Failed to show newly loaded ad:", error);
            handleAdError(error);
          });
        } catch (error) {
          console.error("Exception when showing newly loaded ad:", error);
          handleAdError(error);
        }
      }
    },
    [adTimeout, downloadStarted, handleAdError]
  );

  const {
    isAdLoading,
    showAd,
    isRewarded,
    downloadPending,
    setIsRewarded,
    setDownloadPending,
    resetAdState,
    setIsAdLoading,
    adError,
    currentAd,
    loaded,
  } = useRewardedAd(adRequestOptions, handleAdError, handleAdLoaded);

  const handleDownload = useCallback(async () => {
    // Use the ref value instead of state to avoid stale closures
    if (!imageUrlRef.current) {
      console.log("No URL available");
      return;
    }

    // Check if download is already in progress using state
    if (downloadStarted) {
      console.log("Download already started");
      return;
    }

    try {
      // Set this first to prevent duplicate downloads
      setDownloadStarted(true);
      pendingDownloadRef.current = false;
      console.log("Starting download process...");

      const extension = getFileExtension(imageUrlRef.current);
      const baseFileName = wallpaperName
        ? sanitizeFileName(wallpaperName)
        : "wallpaper_" + new Date().getTime();
      const filename = `${baseFileName}.${extension}`;

      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const downloadResult = await FileSystem.downloadAsync(
        imageUrlRef.current,
        fileUri
      );

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
      setIsRewarded(false);
      setDownloadPending(false);
      resetAdState();
    }
  }, [wallpaperName, downloadStarted, resetAdState]);

  const showPreloadedAd = useCallback(async () => {
    if (isPreloadedAdLoaded && preloadedAd) {
      console.log("Showing preloaded ad from parent component");
      try {
        await preloadedAd.show();
        return true; // Ad shown successfully
      } catch (error) {
        console.error("Error showing preloaded ad:", error);
        // Handle preloaded ad error with the same handler
        handleAdError(error);
        return false; // Failed to show preloaded ad
      }
    }
    return false; // No preloaded ad available
  }, [isPreloadedAdLoaded, preloadedAd, handleAdError]);

  const handlePress = useCallback(() => {
    if (isAdLoading || downloadStarted) {
      console.log("Button already in progress, ignoring press");
      return;
    }

    console.log("Download button pressed");

    // Set the pending download flag
    pendingDownloadRef.current = true;

    setIsAdLoading(true);
    setDownloadPending(true);

    // Set timeout for downloads
    const timeout = setTimeout(() => {
      console.log("Ad took too long to load, starting download...");
      setIsAdLoading(false);
      handleDownload();
    }, 12000);

    setAdTimeout(timeout);

    // Always try preloaded ad first
    showPreloadedAd().then((shown) => {
      if (!shown) {
        console.log("No preloaded ad available, using local ad logic");
        showAd().catch((error) => {
          console.error("Error in showAd:", error);
          handleAdError(error);
        });
      }
    });
  }, [
    isAdLoading,
    downloadStarted,
    handleDownload,
    showAd,
    setIsAdLoading,
    setDownloadPending,
    showPreloadedAd,
    handleAdError,
  ]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (adTimeout) {
        clearTimeout(adTimeout);
      }
    };
  }, [adTimeout]);

  // Handle reward state
  useEffect(() => {
    if (isRewarded && downloadPending && !downloadStarted) {
      console.log("Starting download after reward...");

      if (adTimeout) {
        clearTimeout(adTimeout);
        setAdTimeout(null);
      }

      handleDownload();
    }
  }, [isRewarded, downloadPending, downloadStarted, adTimeout, handleDownload]);

  // Handle preloaded ad events
  useEffect(() => {
    if (preloadedAd) {
      const unsubscribeEarned = preloadedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          console.log("Reward earned from preloaded ad:", reward);
          setIsRewarded(true);
          setDownloadPending(true);
        }
      );

      const unsubscribeClosed = preloadedAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log("Preloaded ad closed");
          if (onAdClosed) onAdClosed();
        }
      );

      const unsubscribeError = preloadedAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.log("Preloaded ad error:", error);
          handleAdError(error);
        }
      );

      return () => {
        unsubscribeEarned();
        unsubscribeClosed();
        unsubscribeError();
      };
    }
  }, [
    preloadedAd,
    setIsRewarded,
    setDownloadPending,
    onAdClosed,
    handleAdError,
  ]);

  // Handle the case when an ad is already loaded when the button is pressed
  useEffect(() => {
    if (
      loaded &&
      currentAd &&
      downloadPending &&
      !isRewarded &&
      !downloadStarted &&
      pendingDownloadRef.current
    ) {
      console.log(
        "Ad was already loaded when button was pressed, showing it now"
      );
      try {
        currentAd.show().catch((error) => {
          console.error("Failed to show already-loaded ad:", error);
          handleAdError(error);
        });
      } catch (error) {
        console.error("Exception when showing already-loaded ad:", error);
        handleAdError(error);
      }
    }
  }, [
    loaded,
    currentAd,
    downloadPending,
    isRewarded,
    downloadStarted,
    handleAdError,
  ]);

  return (
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
  );
};

const styles = StyleSheet.create({
  downloadButton: {
    padding: 10,
  },
});

export default DownloadButton;
