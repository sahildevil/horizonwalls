import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  Text,
  NativeModules,
  Dimensions,
  FlatList,
  ActivityIndicator,
  StatusBar as RNStatusBar,
  SafeAreaView,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as FileSystem from "expo-file-system";
import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ConsentManager from "../../components/ConsentManager";
import DownloadButton from "../../components/DownloadButton";
import { wallpaperService } from "../../services/appwrite";

// Get the true screen dimensions including notches and status bar
const windowDimensions = Dimensions.get("window");
const screenDimensions = Dimensions.get("screen");

// Use screen dimensions for fullscreen content
const { width, height } = screenDimensions;

const Screens = () => {
  const params = useLocalSearchParams();
  const [wallpapers, setWallpapers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);

  const [favorites, setFavorites] = useState([]);
  const flatListRef = useRef(null);

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

  // Load favorites from AsyncStorage
  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem("favorites");
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavorites(parsedFavorites.map((fav) => fav.imageUrl));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  // Check if a wallpaper is favorite
  const isWallpaperFavorite = (imageUrl) => {
    return favorites.includes(imageUrl);
  };

  // Load initial wallpaper and neighbors
  useEffect(() => {
    const loadInitialWallpaper = async () => {
      try {
        setLoading(true);

        // Load favorites
        await loadFavorites();

        // Get wallpaper details from params
        const imageUrl = params.imageUrl
          ? decodeURIComponent(params.imageUrl)
          : null;
        const name = params.name
          ? decodeURIComponent(params.name)
          : "Wallpaper";
        const id = params.id;
        const categoryId = params.categoryId;
        const fromFavorites = params.fromFavorites === "true";
        const favoritesListJSON = params.favoritesList;

        console.log("Opening wallpaper:", {
          imageUrl,
          name,
          id,
          categoryId,
          fromFavorites,
        });

        // Handle favorites mode
        if (fromFavorites && favoritesListJSON) {
          try {
            let favoritesList;
            try {
              favoritesList = JSON.parse(favoritesListJSON);
            } catch (e) {
              favoritesList = favoritesListJSON;
            }

            if (Array.isArray(favoritesList) && favoritesList.length > 0) {
              setWallpapers(favoritesList);
              setHasMore(false);

              const index = favoritesList.findIndex(
                (w) =>
                  (id && w.id === id) || (imageUrl && w.imageUrl === imageUrl)
              );

              if (index !== -1) {
                console.log(`Found wallpaper at index ${index} in favorites`);
                setCurrentIndex(index);
              }

              setLoading(false);
              return;
            }
          } catch (error) {
            console.error("Error parsing favorites list:", error);
          }
        }

        // Main wallpaper loading logic for non-favorites
        let targetWallpaper = null;

        // 1. First try to fetch the clicked wallpaper directly if we have an ID
        if (id) {
          try {
            targetWallpaper = await wallpaperService.getWallpaperById(id);
            console.log(
              "Successfully fetched target wallpaper:",
              targetWallpaper.title
            );
          } catch (error) {
            console.error("Error fetching specific wallpaper:", error);
          }
        }

        // 2. Fetch a batch of wallpapers around the target date
        let mainWallpapers = [];
        let targetIndex = 0;

        if (targetWallpaper) {
          // We have the target wallpaper, now fetch a batch centered around it
          const targetCreatedAt = targetWallpaper.$createdAt;

          // Load newest wallpapers first (up to 10)
          const newestResponse = await wallpaperService.getWallpapers(
            10,
            null,
            categoryId
          );
          let newestWallpapers = newestResponse.documents || [];

          // Check if our target wallpaper is among the newest
          const targetInNewest = newestWallpapers.findIndex(
            (w) => w.$id === id
          );

          if (targetInNewest !== -1) {
            // Target is in the newest batch, use this batch
            console.log(
              "Target wallpaper found in newest batch at position",
              targetInNewest
            );
            mainWallpapers = newestWallpapers;
            targetIndex = targetInNewest;
          } else {
            // Target isn't in newest batch, fetch a centered batch
            console.log("Target not in newest batch, fetching centered batch");

            // First, load wallpapers NEWER than target (these will come first)
            const newerResponse = await wallpaperService.getWallpapersAfter(
              targetCreatedAt,
              5,
              categoryId
            );
            const newerWallpapers = newerResponse?.documents || [];

            // Then, load wallpapers OLDER than target (these will come after)
            const olderResponse = await wallpaperService.getWallpapersBefore(
              targetCreatedAt,
              14,
              categoryId
            );
            const olderWallpapers = olderResponse?.documents || [];

            // Combine in correct order: newer (newest first) + target + older (newest first)
            mainWallpapers = [
              ...newerWallpapers,
              targetWallpaper,
              ...olderWallpapers,
            ];
            targetIndex = newerWallpapers.length;

            console.log(
              `Combined ${newerWallpapers.length} newer + 1 target + ${olderWallpapers.length} older wallpapers`
            );
          }
        } else {
          // No target wallpaper, just load the newest batch
          console.log("No target wallpaper, loading newest batch");
          const response = await wallpaperService.getWallpapers(
            20,
            null,
            categoryId
          );
          mainWallpapers = response.documents || [];

          // Find target by URL if available
          if (imageUrl) {
            const urlIndex = mainWallpapers.findIndex(
              (w) => w.imageUrl === imageUrl
            );
            if (urlIndex !== -1) {
              targetIndex = urlIndex;
            }
          }
        }

        // Update state with the loaded wallpapers
        setWallpapers(mainWallpapers);
        setCurrentIndex(targetIndex);
        setNextCursor(
          mainWallpapers.length > 0
            ? mainWallpapers[mainWallpapers.length - 1].$id
            : null
        );
        setHasMore(mainWallpapers.length >= 20);

        console.log(
          `Loaded ${mainWallpapers.length} wallpapers, target at index ${targetIndex}`
        );
      } catch (error) {
        console.error("Error loading wallpapers:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialWallpaper();
  }, [
    params.imageUrl,
    params.id,
    params.categoryId,
    params.fromFavorites,
    params.favoritesList,
  ]);

  // Add a useEffect after the wallpapers are loaded to ensure correct scrolling
  useEffect(() => {
    // Only proceed if wallpapers are loaded and not loading
    if (
      wallpapers.length > 0 &&
      !loading &&
      flatListRef.current &&
      currentIndex > 0
    ) {
      // Add a small delay to ensure the FlatList has rendered
      const timer = setTimeout(() => {
        try {
          console.log(`Scrolling to wallpaper at index ${currentIndex}`);
          flatListRef.current.scrollToIndex({
            index: currentIndex,
            animated: false,
            viewPosition: 0,
            viewOffset: 0,
          });
        } catch (error) {
          console.error("Error scrolling to index:", error);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [wallpapers, loading, currentIndex]);

  // Also add state to track if the list has initially scrolled
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);

  // Add this state to better track loading states
  const [isLoadingNewer, setIsLoadingNewer] = useState(false);
  const [isAtStart, setIsAtStart] = useState(false);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Update the onEndReached function with a more aggressive approach

  const onEndReached = () => {
    console.log("End reached, attempting to load more wallpapers");
    // Remove hasMore check to force an attempt even if the state suggests no more wallpapers
    if (!loadingMore && !params.fromFavorites) {
      loadMoreWallpapers();
    }
  };

  // Update the loadMoreWallpapers function for more reliability
  const loadMoreWallpapers = async () => {
    if (loadingMore || params.fromFavorites === "true") return;

    try {
      setLoadingMore(true);
      console.log("Loading more older wallpapers...");

      // Get the last (oldest) wallpaper
      const lastWallpaper = wallpapers[wallpapers.length - 1];
      if (!lastWallpaper || !lastWallpaper.$createdAt) {
        console.log("No valid last wallpaper found to paginate from");
        setLoadingMore(false);
        return;
      }

      // Get older wallpapers (created before our oldest one)
      const olderResponse = await wallpaperService.getWallpapersBefore(
        lastWallpaper.$createdAt,
        10,
        params.categoryId
      );

      console.log(
        "Older wallpapers response:",
        olderResponse?.documents?.length
          ? `Found ${olderResponse.documents.length} items`
          : "No items found"
      );

      if (!olderResponse?.documents || olderResponse.documents.length === 0) {
        console.log("No more older wallpapers available");
        setHasMore(false);
        setIsAtEnd(true);
        setLoadingMore(false);
        return;
      }

      // Filter out duplicates using a more reliable method
      const existingIds = new Set(wallpapers.map((wp) => wp.$id || wp.id));
      const newWallpapers = olderResponse.documents.filter(
        (wp) => !existingIds.has(wp.$id)
      );

      console.log(
        `After filtering, found ${newWallpapers.length} unique new wallpapers to add`
      );

      if (newWallpapers.length === 0) {
        console.log("All loaded wallpapers already exist in the list");
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      console.log(
        `Adding ${newWallpapers.length} older wallpapers to the list`
      );
      setWallpapers((prev) => [...prev, ...newWallpapers]);

      // Always assume there might be more unless we got fewer than requested
      setHasMore(newWallpapers.length >= 5);
    } catch (error) {
      console.error("Error loading more wallpapers:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Add a function to detect when user scrolls to the top
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    // If we're at the very top and not already loading newer
    if (
      offsetY < 20 &&
      !isLoadingNewer &&
      !isAtStart &&
      wallpapers.length > 0
    ) {
      loadNewerWallpapers();
    }
  };

  // Improved loadNewerWallpapers function
  const loadNewerWallpapers = async () => {
    if (isLoadingNewer || params.fromFavorites === "true" || isAtStart) return;

    try {
      setIsLoadingNewer(true);
      console.log("Loading newer wallpapers...");

      // Get the first (newest) wallpaper
      const firstWallpaper = wallpapers[0];
      if (!firstWallpaper || !firstWallpaper.$createdAt) {
        setIsLoadingNewer(false);
        return;
      }

      const newerResponse = await wallpaperService.getWallpapersAfter(
        firstWallpaper.$createdAt,
        10,
        params.categoryId
      );

      if (
        !newerResponse ||
        !newerResponse.documents ||
        newerResponse.documents.length === 0
      ) {
        console.log("No newer wallpapers available");
        setIsAtStart(true);
        return;
      }

      // Filter out duplicates
      const existingIds = new Set(wallpapers.map((wp) => wp.$id || wp.id));
      const newWallpapers = newerResponse.documents.filter(
        (wp) => !existingIds.has(wp.$id)
      );

      if (newWallpapers.length === 0) {
        console.log("No new wallpapers to add at the top");
        setIsAtStart(true);
        return;
      }

      console.log(
        `Adding ${newWallpapers.length} newer wallpapers at the beginning`
      );

      // Add new wallpapers and adjust the current index
      setWallpapers((prev) => [...newWallpapers, ...prev]);
      setCurrentIndex((prev) => prev + newWallpapers.length);
    } catch (error) {
      console.error("Error loading newer wallpapers:", error);
    } finally {
      setIsLoadingNewer(false);
    }
  };

  // Update the viewabilityConfigCallbackPairs:
  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        minimumViewTime: 50, // Decreased to be more responsive
        itemVisiblePercentThreshold: 20, // Decreased to detect items earlier
        waitForInteraction: false,
      },
      onViewableItemsChanged: ({ viewableItems }) => {
        if (!viewableItems || viewableItems.length === 0) return;

        const visibleIndex = viewableItems[0].index;

        // Update current index when a new item becomes visible
        if (visibleIndex !== currentIndex) {
          console.log(
            `Now viewing wallpaper at index ${visibleIndex} of ${wallpapers.length}`
          );
          setCurrentIndex(visibleIndex);

          // More aggressive preloading - start loading when within 5 items of the end
          if (visibleIndex >= wallpapers.length - 5) {
            console.log(
              `Within ${
                wallpapers.length - visibleIndex
              } items of the end, preloading more`
            );
            if (!loadingMore) {
              loadMoreWallpapers();
            }
          }
        }
      },
    },
  ]).current;

  // Toggle favorite status for current wallpaper
  const toggleFavorite = async (wallpaper) => {
    if (!wallpaper) return;

    try {
      const savedFavorites = await AsyncStorage.getItem("favorites");
      const favoritesArray = savedFavorites ? JSON.parse(savedFavorites) : [];

      const imageUrl = wallpaper.imageUrl;
      const isFavorite = isWallpaperFavorite(imageUrl);

      if (isFavorite) {
        // Remove from favorites
        const newFavorites = favoritesArray.filter(
          (fav) => fav.imageUrl !== imageUrl
        );
        await AsyncStorage.setItem("favorites", JSON.stringify(newFavorites));
        setFavorites((prev) => prev.filter((url) => url !== imageUrl));
        //Alert.alert("Removed from favorites");
      } else {
        // Add to favorites
        const newFavorite = {
          imageUrl: imageUrl,
          name: wallpaper.title,
          id: wallpaper.$id,
          addedAt: new Date().toISOString(),
        };
        const newFavorites = [...favoritesArray, newFavorite];
        await AsyncStorage.setItem("favorites", JSON.stringify(newFavorites));
        setFavorites((prev) => [...prev, imageUrl]);
        //Alert.alert("Added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorites");
    }
  };

  // Download/Set Wallpaper handling
  const getFileExtension = (url) => {
    const urlExtension = url.split(".").pop().split(/[#?]/)[0];
    const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

    if (validExtensions.includes(urlExtension.toLowerCase())) {
      return urlExtension.toLowerCase();
    }
    return "png";
  };

  const setWallpaper = async (imageUrl) => {
    if (!imageUrl) return;

    try {
      const filename = `temp_wallpaper_${Date.now()}.${getFileExtension(
        imageUrl
      )}`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);

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

  // Render wallpaper item
  const renderWallpaperItem = ({ item }) => {
    // Check if the item is from favorites or from the database
    const isFromFavorites = params.fromFavorites === "true";

    // Get the image URL
    const imageUrl = item.imageUrl;

    // Get the title - handle both database and favorites formats
    const title = isFromFavorites ? item.name || item.title : item.title;

    // Get the ID - handle both database and favorites formats
    const itemId = isFromFavorites ? item.id || item.$id : item.$id;

    // Check if it's in favorites
    const isFavorite = isWallpaperFavorite(imageUrl);

    return (
      <View style={styles.slideContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Header with Back Button and Title */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backbutton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back-outline" size={24} color="white" />
          </TouchableOpacity>

          <Text numberOfLines={1} style={styles.wallpaperTitle}>
            {title}
          </Text>

          <View style={styles.empty} />
        </View>

        {/* Vertical Controls Toolbar (Instagram style) */}
        <View style={styles.verticalToolbar}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => toggleFavorite(item)}
          >
            <AntDesign
              name={isFavorite ? "heart" : "hearto"}
              size={26}
              color={isFavorite ? "#ff4757" : "white"}
            />
            <Text style={styles.toolbarButtonLabel}>
              {isFavorite ? "Saved" : "Save"}
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => setWallpaper(item.imageUrl)}
          >
            <Ionicons name="phone-portrait-outline" size={26} color="white" />
            <Text style={styles.toolbarButtonLabel}>Apply</Text>
          </TouchableOpacity> */}

          <View style={styles.toolbarButton}>
            <DownloadButton
              imageUrl={item.imageUrl}
              wallpaperName={item.title}
              adRequestOptions={getAdRequestOptions()}
              vertical={true} // Add this prop to support vertical layout
            />
          </View>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => {
              // Share functionality
              Alert.alert("Share", "Sharing functionality coming soon!");
            }}
          >
            <Ionicons name="share-social-outline" size={26} color="white" />
            <Text style={styles.toolbarButtonLabel}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Hints at bottom center */}
        <View style={styles.navigationHints}>
          {currentIndex < wallpapers.length - 1 && (
            <Ionicons name="chevron-up" size={24} color="white" />
          )}
          <Text style={styles.hintText}>{getNavigationHintText()}</Text>
          {currentIndex > 0 && (
            <Ionicons name="chevron-down" size={24} color="white" />
          )}
        </View>
      </View>
    );
  };

  // Loading view
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // Error view
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading wallpapers: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace("/Screens")}
        >
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Update the hint text based on current position
  const getNavigationHintText = () => {
    if (wallpapers.length <= 1) return "No more wallpapers";
    if (currentIndex === 0) return "Swipe up for older wallpapers";
    if (currentIndex === wallpapers.length - 1)
      return "Swipe down for newer wallpapers";
    return "Swipe up/down to browse wallpapers";
  };

  // Update the return statement in your component:
  return (
    <View style={styles.outerContainer}>
      <StatusBar translucent style="light" />

      {/* Add header indicator when loading newer */}
      {isLoadingNewer && (
        <View style={styles.topLoaderContainer}>
          <ActivityIndicator color="white" size="small" />
          <Text style={styles.loadingText}>Loading newer wallpapers...</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={wallpapers}
        keyExtractor={(item, index) =>
          `wallpaper-${item?.$id || item?.id || Math.random()}-${index}`
        }
        renderItem={renderWallpaperItem}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
        initialScrollIndex={currentIndex}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        pagingEnabled={true}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5} // Increased from 0.1 to detect end earlier
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        contentContainerStyle={{
          // This ensures no padding is applied
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
        }}
        onScrollToIndexFailed={(info) => {
          console.log("Failed to scroll to index", info);
          setTimeout(() => {
            if (flatListRef.current && wallpapers.length > info.index) {
              flatListRef.current.scrollToOffset({
                offset: info.index * height,
                animated: false,
              });
            }
          }, 100);
        }}
        snapToInterval={height}
        snapToAlignment="start"
        removeClippedSubviews={Platform.OS === "android"}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator color="white" size="large" />
              <Text style={styles.loadingMoreText}>
                Loading more wallpapers...
              </Text>
            </View>
          ) : null
        }
      />

      <ConsentManager onConsentDetermined={handleConsentDetermined} />
    </View>
  );
};

export default Screens;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "black",
    width: screenDimensions.width,
    height: screenDimensions.height,
  },

  container: {
    flex: 1,
    backgroundColor: "black",
    width: screenDimensions.width,
    height: screenDimensions.height,
  },

  slideContainer: {
    width: screenDimensions.width,
    height: screenDimensions.height,
    backgroundColor: "black",
    overflow: "hidden",
  },

  image: {
    position: "absolute",
    width: screenDimensions.width,
    height: screenDimensions.height,
    resizeMode: "cover",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 10,
    width: "100%",
    zIndex: 10,
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
    textAlign: "center",
    flex: 1,
    marginHorizontal: 10,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // New vertical toolbar styles (Instagram Reels style)
  verticalToolbar: {
    //backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 20,
    position: "absolute",
    right: 10,
    bottom: 70,
    alignItems: "center",
    zIndex: 10,
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  toolbarButton: {
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
  // Updated navigation hints for bottom center
  navigationHints: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    alignItems: "center",
    zIndex: 10,
  },
  hintText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    marginTop: 5,
    opacity: 0.8,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  // Keep other existing styles...
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    padding: 20,
  },
  errorText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Outfit-Regular",
  },
  retryButton: {
    backgroundColor: "tomato",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  loadingMoreContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingMoreText: {
    color: "white",
    marginTop: 10,
    fontFamily: "Outfit-Regular",
  },
  topLoaderContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    color: "white",
    marginTop: 5,
    fontFamily: "Outfit-Regular",
  },
});
