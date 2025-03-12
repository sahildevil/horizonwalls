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
import {
  databases,
  DATABASE_ID,
  WALLPAPERS_COLLECTION_ID,
} from "../../services/appwrite";
import { Query } from "appwrite"; // Import directly from appwrite package

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
  // Use categoryId instead of id to match your Appwrite field name
  const params = useLocalSearchParams();
  const categoryId = params.categoryId || params.id;
  const name = params.categoryName
    ? decodeURIComponent(params.categoryName)
    : params.name;

  //console.log(`Loading category: ID=${categoryId}, Name=${name}`);

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

  // Verify if the DATABASE_ID and WALLPAPERS_COLLECTION_ID are loaded
  // console.log("Database and Collection IDs:", {
  //   DATABASE_ID,
  //   WALLPAPERS_COLLECTION_ID,
  //   categoryId,
  // });

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
        //console.log("Already fetching, skipping duplicate request");
        return;
      }

      isFetchingRef.current = true;

      try {
        // Verify that database and collection IDs are defined
        if (!DATABASE_ID || !WALLPAPERS_COLLECTION_ID) {
          throw new Error("Database ID or Collection ID is undefined");
        }

        if (!hasMore && !shouldRefresh) {
          //console.log("No more wallpapers to fetch for category:", categoryId);
          setLoadingMore(false);
          return;
        }

        console.log(
          `Fetching wallpapers for category ${categoryId}, refresh: ${shouldRefresh}, cursor: ${
            nextCursor || "initial"
          }`
        );
        console.log(
          "Using database:",
          DATABASE_ID,
          "and collection:",
          WALLPAPERS_COLLECTION_ID
        );

        // Build Appwrite query
        let queries = [
          Query.equal("categoryId", categoryId), // Find wallpapers with matching categoryId
          Query.limit(20), // Limit to 20 results per fetch
          Query.orderDesc("$createdAt"), // Sort by newest first
        ];

        // Add cursor for pagination if not refreshing
        if (!shouldRefresh && nextCursor) {
          queries.push(Query.cursorAfter(nextCursor));
        }

        // Use Appwrite SDK to fetch wallpapers with explicit string parameters
        // The issue might be that the constants aren't being passed correctly as strings
        const response = await databases.listDocuments(
          DATABASE_ID, // Make sure this is a string
          WALLPAPERS_COLLECTION_ID, // Make sure this is a string
          queries
        );

        //console.log("Appwrite response:", response);

        const data = response.documents || [];
        const total = response.total || 0;

        console.log(`Found ${data.length} wallpapers out of ${total} total`);

        // Set pagination info
        const lastDocument = data.length > 0 ? data[data.length - 1] : null;
        const hasMoreData = data.length >= 20 && data.length < total;

        console.log(
          `Setting hasMore: ${hasMoreData}, nextCursor: ${
            lastDocument?.$id || "null"
          }`
        );
        setHasMore(hasMoreData);
        setNextCursor(lastDocument?.$id || null);

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
        setError(error.message || "Failed to fetch wallpapers");

        // Try a fallback approach if possible
        if (error.message.includes("Missing required parameter")) {
          console.log("Attempting fallback approach with hardcoded IDs");
          try {
            // Attempt with hardcoded values as a last resort
            const response = await databases.listDocuments(
              "67c1554d00000d1e7cb7", // Your DATABASE_ID hardcoded
              "67c1589e0023462338f0", // Your WALLPAPERS_COLLECTION_ID hardcoded
              [Query.equal("categoryId", categoryId), Query.limit(20)]
            );

            if (response && response.documents) {
              console.log(
                "Fallback succeeded! Found",
                response.documents.length,
                "wallpapers"
              );
              setWallpapers(response.documents);
              setError(null);
            }
          } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
          }
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [categoryId, hasMore, nextCursor]
  );

  // Rest of your component stays the same

  // Initial fetch - use a separate effect with categoryId dependency to run when changed
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (isMounted) {
        setLoading(true);
        setWallpapers([]);
        setWallpaperIds(new Set());
        setNextCursor(null);
        setHasMore(true);
        await fetchCategoryWallpapers(true);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

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
        <ActivityIndicator size="small" color="tomato" />
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
        <ActivityIndicator size="large" color="tomato" />
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
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchCategoryWallpapers(true)}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
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
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
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
                id={item.$id}
                params={{ categoryId: categoryId }} // Pass the category context
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
              colors={["tomato"]}
              tintColor={currentTheme.text}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    marginLeft: 8,
    flex: 1,
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
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "tomato",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryText: {
    color: "white",
    fontFamily: "Outfit-Medium",
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
    marginBottom: 20,
  },
});

export default CategoryDetails;
