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
  const adUnitId = __DEV__
    ? TestIds.REWARDED
    : "ca-app-pub-4677981033286236/7236677981";

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
        console.log("Detailed ad error:", {
          message: error.message,
          code: error.code,
          domain: error.domain,
        });

        setAdError(error.message);
        setIsAdLoading(false);
        setDownloadPending(false);
        setLoaded(false);
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
    createAndLoadAd();
  }, [loaded, currentAd, createAndLoadAd, resetAdState]);

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
  const [adTimeout, setAdTimeout] = useState(null);
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
          ToastAndroid.show("Wallpaper saved successfully!", ToastAndroid.SHORT);
        } else {
          // 🔹 Android 11 and below - Request permission first
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === "granted") {
            await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
            ToastAndroid.show("Wallpaper saved successfully!", ToastAndroid.SHORT);
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
      Alert.alert("Download Failed", "There was an error downloading the wallpaper");
    } finally {
      // ✅ Ensure UI updates correctly
      setDownloadStarted(false);
      setIsRewarded(false);
      setDownloadPending(false);
      resetAdState();
    }
  };

  const handlePress = () => {
    if (isAdLoading) return;

    // Start a timeout to auto-download if the ad doesn't load in 5 seconds
    const timeout = setTimeout(() => {
      console.log("Ad took too long to load, starting download...");
      handleDownload();
    }, 8000); // Changed from 100ms to 5000ms (5 seconds)

    setAdTimeout(timeout);
    showAd();
  };

  // Clear timeout when component unmounts
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

    // If ad loads within timeout, clear timeout to prevent auto-download
    if (isAdLoading === false && adTimeout) {
      clearTimeout(adTimeout);
      setAdTimeout(null);
    }
  }, [isRewarded, downloadPending, downloadStarted, isAdLoading, adTimeout]);

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
// const handleDownload = async () => {
//   if (!imageUrl) {
//     console.log("No URL available for download");
//     Alert.alert("Error", "No image URL available for download");
//     return;
//   }

//   try {
//     setDownloadStarted(true);
//     console.log("Starting download process...");

//     const extension = getFileExtension(imageUrl);
//     const baseFileName = wallpaperName
//       ? sanitizeFileName(wallpaperName)
//       : "wallpaper_" + new Date().getTime();
//     const filename = `${baseFileName}.${extension}`;

//     // Download to cache directory first
//     const fileUri = `${FileSystem.cacheDirectory}${filename}`;
//     const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

//     // Ensure permissions for Android 9 and below
//     if (Platform.OS === "android" && Platform.Version < 29) {
//       const { status } = await MediaLibrary.requestPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert(
//           "Permission needed",
//           "Please allow storage permission to save wallpapers"
//         );
//         return;
//       }
//     }

//     // Save the file as a new asset
//     const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);

//     // Specify album name (change "Wallpapers" to any desired album name)
//     const albumName = "Wallpapers";

//     // Check if album exists, if not, create it
//     let album = await MediaLibrary.getAlbumAsync(albumName);
//     if (!album) {
//       album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
//     } else {
//       await MediaLibrary.addAssetsToAlbumAsync([asset], album.id, false);
//     }

//     // Notify user
//     if (Platform.OS === "android") {
//       ToastAndroid.show("Wallpaper saved successfully!", ToastAndroid.SHORT);
//     } else {
//       Alert.alert("Success", "Wallpaper saved successfully!");
//     }

//     // Clean up cached file
//     await FileSystem.deleteAsync(fileUri, { idempotent: true });
//   } catch (error) {
//     console.error("Download error:", error);
//     Alert.alert("Download Failed", "There was an error downloading the wallpaper");
//   } finally {
//     setDownloadStarted(false);
//     setIsRewarded(false);
//     setDownloadPending(false);
//     resetAdState();
//   }
// };



//Different approach to download button


// import React, { useEffect, useState, useCallback } from "react";
// import {
//   StyleSheet,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   Platform,
//   ToastAndroid,
//   Share,
// } from "react-native";
// import * as FileSystem from "expo-file-system";
// import * as MediaLibrary from "expo-media-library";
// import { Feather } from "@expo/vector-icons";
// import {
//   RewardedAd,
//   TestIds,
//   AdEventType,
//   RewardedAdEventType,
// } from "react-native-google-mobile-ads";
// import CustomAlert from "./CustomAlert";

// // Remove RNFS import since we're using Expo's FileSystem instead

// // Utility functions remain the same
// const sanitizeFileName = (name) => {
//   return name?.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() || "";
// };

// const getFileExtension = (url) => {
//   const urlExtension = url?.split(".")?.pop()?.split(/[#?]/)[0];
//   const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

//   if (validExtensions.includes(urlExtension?.toLowerCase())) {
//     return urlExtension.toLowerCase();
//   }
//   return "png";
// };

// // Get original filename from URL for less permissions
// const getOriginalFilename = (url) => {
//   if (!url) return null;

//   const pathSegments = url.split("/");
//   let filename = pathSegments[pathSegments.length - 1];

//   if (filename.includes("?")) {
//     filename = filename.split("?")[0];
//   }

//   if (filename.includes("#")) {
//     filename = filename.split("#")[0];
//   }

//   return filename || `wallpaper_${new Date().getTime()}.png`;
// };

// const useRewardedAd = () => {
//   // Keep existing ad code
//   const [loaded, setLoaded] = useState(false);
//   const [isRewarded, setIsRewarded] = useState(false);
//   const [currentAd, setCurrentAd] = useState(null);
//   const [isAdLoading, setIsAdLoading] = useState(false);
//   const [downloadPending, setDownloadPending] = useState(false);
//   const [shouldLoadNewAd, setShouldLoadNewAd] = useState(true);
//   const [adError, setAdError] = useState(null);

//   const adUnitId = __DEV__
//     ? TestIds.REWARDED
//     : "ca-app-pub-4677981033286236/7236677981";

//   useEffect(() => {
//     console.log("Current environment:", __DEV__ ? "Development" : "Production");
//     console.log("Platform:", Platform.OS);
//     console.log("Using ad unit ID:", adUnitId);
//   }, []);

//   const createAndLoadAd = useCallback(() => {
//     // Keep existing ad loading code
//     if (!shouldLoadNewAd) return () => {};

//     console.log("Creating new ad request...");

//     const newAd = RewardedAd.createForAdRequest(adUnitId, {
//       requestNonPersonalizedAdsOnly: true,
//       keywords: [
//         "wallpaper",
//         "art",
//         "design",
//         "photography",
//         "illustration",
//         "backgrounds",
//         "aesthetic",
//         "nature",
//         "abstract",
//         "patterns",
//       ],
//     });

//     const unsubscribeLoaded = newAd.addAdEventListener(
//       RewardedAdEventType.LOADED,
//       () => {
//         console.log("Ad loaded successfully");
//         setLoaded(true);
//         setCurrentAd(newAd);
//         setIsAdLoading(false);
//         setAdError(null);
//       }
//     );

//     const unsubscribeEarned = newAd.addAdEventListener(
//       RewardedAdEventType.EARNED_REWARD,
//       () => {
//         console.log("User earned reward");
//         setIsRewarded(true);
//         setDownloadPending(true);
//         setShouldLoadNewAd(false);
//       }
//     );

//     const unsubscribeClosed = newAd.addAdEventListener(
//       AdEventType.CLOSED,
//       () => {
//         console.log("Ad closed");
//         setLoaded(false);
//         setCurrentAd(null);
//         // Don't create new ad here
//       }
//     );

//     const unsubscribeError = newAd.addAdEventListener(
//       AdEventType.ERROR,
//       (error) => {
//         console.log("Ad error:", error);
//         setAdError(error.message);
//         setIsAdLoading(false);
//         setLoaded(false);
//         setIsRewarded(true);
//         setDownloadPending(true);
//         setShouldLoadNewAd(false);
//         //ToastAndroid.show("Processing download...", ToastAndroid.SHORT);
//       }
//     );

//     console.log("Loading ad...");
//     newAd.load();

//     return () => {
//       unsubscribeLoaded();
//       unsubscribeEarned();
//       unsubscribeClosed();
//       unsubscribeError();
//     };
//   }, [adUnitId, shouldLoadNewAd]);

//   // Keep rest of ad code
//   const resetAdState = useCallback(() => {
//     setLoaded(false);
//     setIsRewarded(false);
//     setCurrentAd(null);
//     setIsAdLoading(false);
//     setDownloadPending(false);
//     setShouldLoadNewAd(true);
//   }, []);

//   const showAd = useCallback(async () => {
//     if (isAdLoading) {
//       console.log("Ad is already loading");
//       return;
//     }

//     setIsAdLoading(true);
//     setDownloadPending(true);

//     const timeoutId = setTimeout(() => {
//       if (!loaded) {
//         console.log("Ad load timeout");
//         setIsRewarded(true);
//         setDownloadPending(true);
//         setIsAdLoading(false);
//         setShouldLoadNewAd(false);
//         ToastAndroid.show(
//           "Ad taking too long, Starting download...",
//           ToastAndroid.SHORT
//         );
//       }
//     }, 7000);

//     try {
//       if (loaded && currentAd) {
//         clearTimeout(timeoutId);
//         await currentAd.show();
//       } else {
//         createAndLoadAd();
//       }
//     } catch (error) {
//       console.error("Error showing ad:", error);
//       clearTimeout(timeoutId);
//       setIsRewarded(true);
//       setDownloadPending(true);
//       setIsAdLoading(false);
//       setShouldLoadNewAd(false);
//     }
//   }, [loaded, currentAd, createAndLoadAd, isAdLoading]);

//   useEffect(() => {
//     const cleanup = createAndLoadAd();
//     return () => {
//       cleanup();
//       setCurrentAd(null);
//       setLoaded(false);
//     };
//   }, [createAndLoadAd]);

//   return {
//     loaded,
//     isRewarded,
//     isAdLoading,
//     downloadPending,
//     showAd,
//     setIsRewarded,
//     setDownloadPending,
//     resetAdState,
//     adError,
//   };
// };

// const DownloadButton = ({ imageUrl, wallpaperName }) => {
//   const [downloadStarted, setDownloadStarted] = useState(false);
//   const [showAlert, setShowAlert] = useState(false);
//   const {
//     isAdLoading,
//     showAd,
//     isRewarded,
//     downloadPending,
//     setIsRewarded,
//     setDownloadPending,
//     resetAdState,
//   } = useRewardedAd();

//   const handleDownload = async () => {
//     if (!imageUrl) {
//       Alert.alert("Error", "No image URL available for download");
//       return;
//     }

//     try {
//       setDownloadStarted(true);
//       console.log("Starting download process for:", imageUrl);

//       // Use original filename from URL to avoid permission issues
//       const originalFilename = getOriginalFilename(imageUrl);
//       console.log("Using filename:", originalFilename);

//       // Download to cache directory first
//       const fileUri = `${FileSystem.cacheDirectory}${originalFilename}`;
//       console.log("Downloading to temp location:", fileUri);

//       const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
//       console.log("Download complete, status:", downloadResult.status);

//       // Get media library permission - uses more compatible approach
//       const { status } = await MediaLibrary.requestPermissionsAsync(false);
//       console.log("Media library permission status:", status);

//       if (status === "granted" || status === "limited") {
//         // Save file to media library
//         const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
//         console.log("Asset created:", asset);

//         // Try to save to album
//         try {
//           let album = await MediaLibrary.getAlbumAsync("HorizonWalls");

//           if (album === null) {
//             console.log("Creating new album 'HorizonWalls'");
//             album = await MediaLibrary.createAlbumAsync(
//               "HorizonWalls",
//               asset,
//               false
//             );
//           } else {
//             console.log("Adding to existing 'HorizonWalls' album");
//             await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
//           }

//           ToastAndroid.show(
//             "Wallpaper saved in HorizonWalls folder!",
//             ToastAndroid.SHORT
//           );
//         } catch (albumError) {
//           console.error("Error with album:", albumError);
//           // Still saved to gallery even if album fails
//           ToastAndroid.show("Wallpaper saved to gallery!", ToastAndroid.SHORT);
//         }
//       } else {
//         // Permission denied
//         console.log("Permission denied, offering share option");
//         Alert.alert(
//           "Permission Denied",
//           "Would you like to share this wallpaper instead?",
//           [
//             { text: "Cancel", style: "cancel" },
//             {
//               text: "Share",
//               onPress: () => {
//                 Share.share({
//                   url: downloadResult.uri,
//                   message: "Check out this amazing wallpaper!",
//                 });
//               },
//             },
//           ]
//         );
//       }

//       // Clean up cached file
//       try {
//         await FileSystem.deleteAsync(fileUri, { idempotent: true });
//         console.log("Temp file cleaned up");
//       } catch (cleanupError) {
//         console.warn("Failed to clean up temp file:", cleanupError);
//       }
//     } catch (error) {
//       console.error("Download error:", error);
//       Alert.alert(
//         "Download Failed",
//         "There was an error downloading the wallpaper"
//       );
//     } finally {
//       console.log("Download process complete, resetting states");
//       setDownloadStarted(false);
//       setIsRewarded(false);
//       setDownloadPending(false);
//       resetAdState();
//     }
//   };

//   useEffect(() => {
//     if (isRewarded && downloadPending && !downloadStarted) {
//       console.log("Starting download after reward...");
//       handleDownload();
//     }
//   }, [isRewarded, downloadPending, downloadStarted, imageUrl, wallpaperName]);

//   const handlePress = () => {
//     setShowAlert(true);
//   };

//   const handleConfirm = () => {
//     setShowAlert(false);
//     showAd();
//   };

//   return (
//     <>
//       <TouchableOpacity
//         onPress={handlePress}
//         disabled={isAdLoading || downloadStarted}
//         style={styles.downloadButton}
//       >
//         {isAdLoading || downloadStarted ? (
//           <ActivityIndicator size="small" color="white" />
//         ) : (
//           <Feather name="download" size={24} color="white" />
//         )}
//       </TouchableOpacity>

//       <CustomAlert
//         visible={showAlert}
//         onClose={() => setShowAlert(false)}
//         onConfirm={handleConfirm}
//       />
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   downloadButton: {
//     padding: 10,
//   },
// });

// export default DownloadButton;