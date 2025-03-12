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
        const id = params.id; // This will be useful if coming from search or category

        // If we have an ID, we can position exactly at that wallpaper
        // Otherwise, we'll use the imageUrl to find the closest match

        // Fetch initial batch of wallpapers
        const response = await wallpaperService.getWallpapers(20);

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
              setCurrentIndex(index);
            }
          } else if (imageUrl) {
            const index = response.documents.findIndex(
              (w) => w.imageUrl === imageUrl
            );
            if (index !== -1) {
              setCurrentIndex(index);
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
  }, [params.imageUrl, params.id]);

  // Load more wallpapers when approaching the end
  const loadMoreWallpapers = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      console.log("Loading more wallpapers, cursor:", nextCursor);

      const response = await wallpaperService.getWallpapers(20, nextCursor);

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
    const isFavorite = isWallpaperFavorite(item.imageUrl);

    return (
      <View style={styles.slideContainer}>
        <Image
          source={{ uri: item.imageUrl }}
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
            {item.title}
          </Text>

          <View style={styles.empty} />
        </View>

        {/* Controls Toolbar */}
        <View style={styles.toolbar}>
          <DownloadButton
            imageUrl={item.imageUrl}
            wallpaperName={item.title}
            adRequestOptions={getAdRequestOptions()}
          />
          <TouchableOpacity onPress={() => toggleFavorite(item)}>
            <AntDesign
              name={isFavorite ? "heart" : "hearto"}
              size={24}
              color={isFavorite ? "#ff4757" : "white"}
            />
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={() => setWallpaper(item.imageUrl)}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity> */}
        </View>

        {/* Navigation Hints */}
        <View style={styles.navigationHints}>
          <Text style={styles.hintText}>Swipe for more wallpapers</Text>
          <View style={styles.arrows}>
            <Ionicons name="chevron-up" size={20} color="white" />
          </View>
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
  toolbar: {
    position: "absolute",
    bottom: 50,
    width: "70%",
    height: 50,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 10,
  },
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
  navigationHints: {
    position: "absolute",
    bottom: 120,
    width: "100%",
    alignItems: "center",
  },
  hintText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Outfit-Regular",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 5,
    opacity: 0.8,
  },
  arrows: {
    opacity: 0.8,
  },
});
