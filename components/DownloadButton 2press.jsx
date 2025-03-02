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

  const useRewardedAd = (adRequestOptions = {}) => {
    const [loaded, setLoaded] = useState(false);
    const [isRewarded, setIsRewarded] = useState(false);
    const [currentAd, setCurrentAd] = useState(null);
    const [isAdLoading, setIsAdLoading] = useState(false);
    const [downloadPending, setDownloadPending] = useState(false);
    const [shouldLoadNewAd, setShouldLoadNewAd] = useState(true);
    const [adError, setAdError] = useState(null);
    const adCreated = React.useRef(false);

    const adUnitId = "ca-app-pub-4677981033286236/7236677981";

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
          console.log("Detailed ad error:", {
            message: error.message,
            code: error.code,
            domain: error.domain,
          });

          setAdError(error.message);
          setIsAdLoading(false);

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
    }, [adUnitId, downloadPending, shouldLoadNewAd, adRequestOptions]);

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
          console.log("Showing already loaded ad");
          await currentAd.show();
        } catch (error) {
          console.error("Error showing ad:", error);

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
    }, [loaded, currentAd, createAndLoadAd, resetAdState, downloadPending]);

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
    const [downloadTriggered, setDownloadTriggered] = useState(false);
    const [forceDownload, setForceDownload] = useState(false);

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
    } = useRewardedAd(adRequestOptions);

    const showPreloadedAd = useCallback(async () => {
      if (isPreloadedAdLoaded && preloadedAd) {
        console.log("Showing preloaded ad from parent component");
        try {
          await preloadedAd.show();
          return true; // Ad shown successfully
        } catch (error) {
          console.error("Error showing preloaded ad:", error);
          return false; // Failed to show preloaded ad
        }
      }
      return false; // No preloaded ad available
    }, [isPreloadedAdLoaded, preloadedAd]);

    const handlePress = useCallback(() => {
      if (isAdLoading || downloadStarted) return;

      console.log("Download button pressed");

      setIsAdLoading(true);
      setDownloadPending(true);

      const timeout = setTimeout(() => {
        console.log("Ad took too long to load, starting download...");
        setIsAdLoading(false);
        handleDownload();
      }, 8000);

      setAdTimeout(timeout);

      showPreloadedAd().then((shown) => {
        if (!shown) {
          console.log("No preloaded ad available, using local ad logic");
          showAd().catch((error) => {
            console.error("Error in showAd:", error);
            if (adTimeout) {
              clearTimeout(adTimeout);
              setAdTimeout(null);
            }
            setIsAdLoading(false);
            handleDownload(); // This ensures download happens on ad error
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
    ]);

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

        return () => {
          unsubscribeEarned();
          unsubscribeClosed();
        };
      }
    }, [preloadedAd, setIsRewarded, setDownloadPending, onAdClosed]);

    const handleDownload = useCallback(async () => {
      if (!imageUrl || downloadStarted) {
        console.log("Download already started or no URL available");
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
        setIsRewarded(false);
        setDownloadPending(false);
        resetAdState();
      }
    }, [imageUrl, wallpaperName, downloadStarted]);

    useEffect(() => {
      return () => {
        if (adTimeout) {
          clearTimeout(adTimeout);
        }
      };
    }, [adTimeout]);

    useEffect(() => {
      if (isRewarded && downloadPending && !downloadStarted) {
        console.log("Starting download after reward...");
        handleDownload();
      }

      if (isAdLoading === false && adTimeout) {
        clearTimeout(adTimeout);
        setAdTimeout(null);
      }
    }, [isRewarded, downloadPending, downloadStarted, isAdLoading, adTimeout]);

    useEffect(() => {
      return () => {
        if (adTimeout) {
          clearTimeout(adTimeout);
        }
      };
    }, [adTimeout]);

    useEffect(() => {
      if (isRewarded && downloadPending && !downloadStarted) {
        console.log("Starting download after reward...");

        if (adTimeout) {
          clearTimeout(adTimeout);
          setAdTimeout(null);
        }

        handleDownload();
      }
    }, [isRewarded, downloadPending, downloadStarted, adTimeout]);

    useEffect(() => {
      if (!isAdLoading && downloadPending && !isRewarded && !downloadStarted) {
        console.log(
          "Ad loading finished but no reward granted, checking status..."
        );

        const failsafeTimeout = setTimeout(() => {
          console.log(
            "No reward received after ad loading finished, starting download anyway"
          );
          handleDownload();
        }, 2000);

        return () => clearTimeout(failsafeTimeout);
      }
    }, [isAdLoading, downloadPending, isRewarded, downloadStarted]);

    useEffect(() => {
      if (adError && downloadPending && !downloadStarted) {
        console.log("Ad error detected in component, error:", adError);

        if (adTimeout) {
          clearTimeout(adTimeout);
          setAdTimeout(null);
        }

        setForceDownload(true);
      }
    }, [adError, downloadPending, downloadStarted]);

    useEffect(() => {
      if (forceDownload) {
        console.log("Force download triggered by ad error");
        handleDownload();
        setForceDownload(false);
      }
    }, [forceDownload]);

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