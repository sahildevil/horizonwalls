import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Text,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import ImageCard from "../../components/ImageCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../providers/ThemeProvider";

const API_URL = process.env.EXPO_PUBLIC_API_URL + "/wallpapers";
const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const CONTAINER_PADDING = 16;
const NUMBER_OF_COLUMNS = 2;

// Calculate card width and height
const CARD_WIDTH =
  (width - CONTAINER_PADDING * 2 - CARD_MARGIN * (NUMBER_OF_COLUMNS + 1)) /
  NUMBER_OF_COLUMNS;
const CARD_HEIGHT = (CARD_WIDTH * 16) / 9;

const CategoryDetails = () => {
  const { id, name } = useLocalSearchParams();
  const { isDarkTheme, currentTheme } = useTheme();
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [wallpaperIds, setWallpaperIds] = useState(new Set());
  const [isEndReached, setIsEndReached] = useState(false);

  const isFetchingRef = useRef(false);
  // Use refs to avoid dependency cycles
  const wallpapersRef = useRef([]);
  const wallpaperIdsRef = useRef(new Set());
  const router = useRouter();

  // Update refs when state changes
  useEffect(() => {
    wallpapersRef.current = wallpapers;
    wallpaperIdsRef.current = wallpaperIds;
  }, [wallpapers, wallpaperIds]);

  const fetchCategoryWallpapers = useCallback(
    async (shouldRefresh = false) => {
      // Prevent multiple simultaneous fetches
      if (isFetchingRef.current && !shouldRefresh) {
        console.log("Already fetching, skipping duplicate request");
        return;
      }

      isFetchingRef.current = true;

      try {
        if (!hasMore && !shouldRefresh) {
          console.log("No more wallpapers to fetch for category:", id);
          setLoadingMore(false);
          return;
        }

        // Construct URL based on whether this is initial or subsequent fetch
        let url = `${API_URL}?limit=20&category=${id}`;
        if (!shouldRefresh && nextCursor) {
          url += `&cursor=${nextCursor}`;
        }

        // Add a random cache buster to prevent caching issues
        url += `&_=${new Date().getTime()}`;

        console.log("Fetching from URL:", url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("Raw API response for category:", responseData);

        const data = responseData.documents || responseData;

        // Check if the API returns pagination info
        const paginationInfo = responseData.pagination;

        console.log("Fetched category wallpapers count:", data.length);
        console.log("Pagination info:", paginationInfo);

        // If server provides pagination info, use it
        if (paginationInfo) {
          const cursorExists = !!paginationInfo.nextCursor;
          console.log(
            `Setting hasMore to ${cursorExists} based on nextCursor existence`
          );
          setHasMore(cursorExists);
          setNextCursor(paginationInfo.nextCursor);
        } else {
          // Fallback to checking length
          const newHasMore = data.length >= 20;
          console.log(
            `Setting hasMore to ${newHasMore} based on data length check`
          );
          setHasMore(newHasMore);
        }

        // Handle empty response
        if (data.length === 0) {
          console.log("No data returned, setting hasMore to false");
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
          return;
        }

        // Create a new array to hold unique wallpapers
        let newWallpapers;

        if (shouldRefresh) {
          // On refresh, reset everything and use new data
          newWallpapers = data;

          // Reset the ID tracking Set
          const newIds = new Set();
          data.forEach((wallpaper) => newIds.add(wallpaper.$id));
          console.log(`Reset wallpaperIds, new count: ${newIds.size}`);
          setWallpaperIds(newIds);
        } else {
          // Get current wallpaperIds from ref to avoid dependency issues
          const currentIds = wallpaperIdsRef.current;

          // Filter out any duplicates
          newWallpapers = data.filter(
            (wallpaper) => !currentIds.has(wallpaper.$id)
          );

          console.log(
            `After filtering, found ${newWallpapers.length} new unique wallpapers`
          );

          // If no new unique wallpapers were found, we've reached the end
          if (newWallpapers.length === 0) {
            console.log("No new unique wallpapers found, ending pagination");
            setHasMore(false);
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
            return;
          }

          // Update our set of wallpaper IDs
          const newIds = new Set(currentIds);
          newWallpapers.forEach((wallpaper) => newIds.add(wallpaper.$id));
          console.log(`Updated wallpaperIds, new count: ${newIds.size}`);
          setWallpaperIds(newIds);
        }

        // Update the wallpapers array
        if (shouldRefresh) {
          console.log(`Setting ${newWallpapers.length} wallpapers (refresh)`);
          setWallpapers(newWallpapers);
        } else {
          const currentWallpapers = wallpapersRef.current;
          console.log(
            `Adding ${newWallpapers.length} new wallpapers to existing ${currentWallpapers.length}`
          );
          setWallpapers([...currentWallpapers, ...newWallpapers]);
        }
      } catch (error) {
        console.error("Error fetching category wallpapers:", error);
        setError(error.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [id, hasMore, nextCursor]
  ); // Removed wallpaperIds and wallpapers.length from dependencies

  // Initial fetch - use a separate effect with no dependencies to run only once
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (isMounted) {
        await fetchCategoryWallpapers(true);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setNextCursor(null); // Clear cursor on refresh
    setHasMore(true);
    setWallpaperIds(new Set());
    // Use setTimeout to ensure state updates have happened
    setTimeout(() => {
      fetchCategoryWallpapers(true);
    }, 0);
  }, [fetchCategoryWallpapers]);

  const loadMore = useCallback(() => {
    if (loadingMore) {
      console.log("Already loading more, ignoring request");
      return;
    }

    if (!hasMore) {
      console.log("No more data to load");
      return;
    }

    if (refreshing) {
      console.log("Currently refreshing, ignoring load more");
      return;
    }

    if (!nextCursor) {
      console.log("No next cursor available");
      return;
    }

    console.log("Loading more wallpapers, cursor:", nextCursor);
    setLoadingMore(true);

    // Add a slight delay to prevent race conditions
    setTimeout(() => {
      fetchCategoryWallpapers(false);
    }, 300);
  }, [loadingMore, hasMore, refreshing, nextCursor, fetchCategoryWallpapers]);

  const onEndReachedHandler = useCallback(
    ({ distanceFromEnd }) => {
      console.log(`End reached with distance ${distanceFromEnd}`);

      if (
        isFetchingRef.current ||
        !hasMore ||
        loadingMore ||
        refreshing ||
        isEndReached
      ) {
        console.log("Skipping end reached due to:", {
          isAlreadyFetching: isFetchingRef.current,
          hasMore,
          loadingMore,
          refreshing,
          isEndReached,
        });
        return;
      }

      console.log("Will load more content");
      setIsEndReached(true);

      // Using setTimeout to avoid state update conflicts
      setTimeout(() => {
        loadMore();

        // Reset the flags after a delay
        setTimeout(() => {
          setIsEndReached(false);
        }, 1000);
      }, 100);
    },
    [hasMore, loadingMore, refreshing, isEndReached, loadMore]
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color='tomato' />
      </View>
    );
  };

  const renderEndMessage = () => {
    if (wallpapers.length > 0 && !hasMore && !loadingMore) {
      return (
        <Text style={[styles.endMessage, { color: currentTheme.text }]}>
          No more wallpapers in this category
        </Text>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View
        style={[styles.loader, { backgroundColor: currentTheme.background }]}
      >
        <ActivityIndicator size="large" color='tomato' />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: currentTheme.background },
        ]}
      >
        <Text style={[styles.errorText, { color: currentTheme.text }]}>
          Error loading wallpapers: {error}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          marginLeft: 10,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={currentTheme.text}
          />
        </TouchableOpacity>

        <Text style={[styles.title, { color: currentTheme.text }]}>{name}</Text>
      </View>

      {wallpapers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: currentTheme.text }]}>
            No wallpapers found in this category
          </Text>
        </View>
      ) : (
        <FlatList
          data={wallpapers}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <View style={{ margin: CARD_MARGIN }}>
              <ImageCard
                imageUrl={item.imageUrl}
                wallpaperName={item.title}
                style={[
                  styles.card,
                  { backgroundColor: currentTheme.cardBackground },
                ]}
              />
            </View>
          )}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4285F4"]}
              tintColor={currentTheme.primary}
            />
          }
          onEndReached={onEndReachedHandler}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            <>
              {renderFooter()}
              {renderEndMessage()}
            </>
          }
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    marginHorizontal: 20,
    marginBottom: 0,
  },
  listContainer: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: CONTAINER_PADDING,
    alignItems: "center", // Center cards horizontally
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    fontFamily: "Outfit-Regular",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endMessage: {
    textAlign: "center",
    padding: 10,
    fontFamily: "Outfit-Regular",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Outfit-Regular",
  },
});

export default CategoryDetails;
