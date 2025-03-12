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

const { width, height } = Dimensions.get("window");

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
        const favoritesListJSON = params.favoritesList; // This will be a JSON string

        console.log("Opening wallpaper:", {
          imageUrl,
          name,
          id,
          categoryId,
          fromFavorites,
        });

        // If coming from favorites, use the provided favorites list
        if (fromFavorites && favoritesListJSON) {
          try {
            // First try to parse if it's already a JSON string
            let favoritesList;
            try {
              // If it's passed as a JSON string (which happens through URL params)
              favoritesList = JSON.parse(favoritesListJSON);
            } catch (e) {
              // If it's already an object (direct navigation within JS)
              favoritesList = favoritesListJSON;
            }

            console.log(
              "Using favorites list for wallpapers:",
              Array.isArray(favoritesList)
                ? favoritesList.length
                : "Invalid favorites"
            );

            // Use favorites as our wallpapers source
            if (Array.isArray(favoritesList) && favoritesList.length > 0) {
              setWallpapers(favoritesList);
              setHasMore(false); // No pagination for favorites

              // Find the index of the current wallpaper
              const index = favoritesList.findIndex(
                (w) =>
                  (id && w.id === id) || (imageUrl && w.imageUrl === imageUrl)
              );

              if (index !== -1) {
                console.log(`Found wallpaper at index ${index} in favorites`);
                setCurrentIndex(index);
              }

              setLoading(false);
              return; // Exit early, we've loaded from favorites
            }
          } catch (error) {
            console.error("Error parsing favorites list:", error);
            // Fall back to normal loading if favorites parsing fails
          }
        }

        // If not from favorites, or if favorites loading failed, proceed with normal loading
        let response;

        // If we have a categoryId, fetch only wallpapers from that category
        if (categoryId) {
          console.log(`Loading wallpapers from category: ${categoryId}`);
          response = await wallpaperService.getWallpapersByCategory(
            categoryId,
            20
          );
        } else {
          // Otherwise fetch all wallpapers
          console.log("Loading all wallpapers");
          response = await wallpaperService.getWallpapers(20);
        }

        if (response && response.documents) {
          console.log(`Loaded ${response.documents.length} wallpapers`);

          // Store the wallpapers
          setWallpapers(response.documents);

          // Set pagination cursor for loading more
          if (response.pagination) {
            setNextCursor(response.pagination.nextCursor);
            setHasMore(!!response.pagination.nextCursor);
          }

          // Find index of the current wallpaper
          if (id) {
            const index = response.documents.findIndex((w) => w.$id === id);
            if (index !== -1) {
              console.log(`Found wallpaper at index ${index}`);
              setCurrentIndex(index);
            } else {
              console.log(
                `Wallpaper with ID ${id} not found in the loaded wallpapers`
              );
            }
          } else if (imageUrl) {
            const index = response.documents.findIndex(
              (w) => w.imageUrl === imageUrl
            );
            if (index !== -1) {
              console.log(`Found wallpaper at index ${index}`);
              setCurrentIndex(index);
            } else {
              console.log(
                `Wallpaper with URL ${imageUrl} not found in the loaded wallpapers`
              );
            }
          }
        }
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

  // Load more wallpapers when approaching the end
  const loadMoreWallpapers = async () => {
    if (!hasMore || loadingMore) return;

    // Check if we're in favorites mode - if so, no more loading needed
    if (params.fromFavorites === "true") {
      console.log("In favorites mode - no more wallpapers to load");
      setHasMore(false);
      return;
    }

    try {
      setLoadingMore(true);
      console.log("Loading more wallpapers, cursor:", nextCursor);

      const categoryId = params.categoryId;
      let response;

      // If we have a categoryId, fetch more wallpapers from that category
      if (categoryId) {
        console.log(`Loading more wallpapers from category: ${categoryId}`);
        response = await wallpaperService.getWallpapersByCategory(
          categoryId,
          20,
          nextCursor
        );
      } else {
        // Otherwise fetch all wallpapers
        console.log("Loading more from all wallpapers");
        response = await wallpaperService.getWallpapers(20, nextCursor);
      }

      if (response && response.documents && response.documents.length > 0) {
        setWallpapers((prev) => [...prev, ...response.documents]);

        if (response.pagination) {
          setNextCursor(response.pagination.nextCursor);
          setHasMore(!!response.pagination.nextCursor);
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more wallpapers:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle viewable items change
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setCurrentIndex(index);
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

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
          <Ionicons name="chevron-up" size={24} color="white" />
          <Text style={styles.hintText}>Swipe up for next wallpaper</Text>
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

  return (
    <View style={styles.container}>
      <StatusBar translucent style="light" />

      <FlatList
        ref={flatListRef}
        data={wallpapers}
        keyExtractor={(item) => item.$id}
        renderItem={renderWallpaperItem}
        initialScrollIndex={currentIndex}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={() => {
          if (wallpapers.length >= 10 && currentIndex > wallpapers.length - 5) {
            loadMoreWallpapers();
          }
        }}
        onEndReachedThreshold={0.5}
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
        snapToInterval={height}
        decelerationRate="fast"
        snapToAlignment="start"
        vertical
      />

      <ConsentManager onConsentDetermined={handleConsentDetermined} />
    </View>
  );
};

export default Screens;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  slideContainer: {
    width,
    height,
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
});
