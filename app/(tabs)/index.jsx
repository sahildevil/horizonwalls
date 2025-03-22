import {
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import Header from "../../components/Header";
import ImageCard from "../../components/ImageCard";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../providers/ThemeProvider";
import { useScrollContext } from "../../providers/ScrollContext";
import { wallpaperService } from "../../services/appwrite";
import NotificationPrompt from "../../components/NotificationPrompt";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const CONTAINER_PADDING = 10;
const NUMBER_OF_COLUMNS = 2;

const CARD_WIDTH =
  (width - CONTAINER_PADDING * 2 - CARD_MARGIN * (NUMBER_OF_COLUMNS + 1)) /
  NUMBER_OF_COLUMNS;
const CARD_HEIGHT = (CARD_WIDTH * 16) / 9;

const Home = () => {
  const { isDarkTheme, currentTheme } = useTheme();
  const { handleScroll } = useScrollContext();
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // For cursor-based pagination
  const [nextCursor, setNextCursor] = useState(null);

  // Track wallpaper IDs to avoid duplicates
  const [wallpaperIds, setWallpaperIds] = useState(new Set());

  // Add a state to track if we're already at the end
  const [isEndReached, setIsEndReached] = useState(false);

  // Add a ref to track if we're already fetching
  const isFetchingRef = useRef(false);

  const fetchWallpapers = async (shouldRefresh = false) => {
    try {
      console.log(
        `Fetching wallpapers (refresh: ${shouldRefresh}, cursor: ${
          nextCursor || "initial"
        })`
      );

      if (!hasMore && !shouldRefresh) {
        console.log("No more wallpapers to fetch");
        setLoadingMore(false);
        return;
      }

      // Use direct Appwrite service instead of API call
      const response = await wallpaperService.getWallpapers(
        20, // limit
        shouldRefresh ? null : nextCursor // cursor (null if refreshing)
      );

      //console.log("Appwrite response:", response);

      const data = response.documents;
      const paginationInfo = response.pagination;

      //console.log("Fetched wallpapers count:", data.length);
      //console.log("Pagination info:", paginationInfo);

      // Handle pagination
      if (paginationInfo) {
        const cursorExists = !!paginationInfo.nextCursor;
        console.log(
          `Setting hasMore to ${cursorExists} based on nextCursor existence`
        );
        setHasMore(cursorExists);
        setNextCursor(paginationInfo.nextCursor);
      } else {
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
        // Filter out any duplicates
        newWallpapers = data.filter(
          (wallpaper) => !wallpaperIds.has(wallpaper.$id)
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
        const newIds = new Set(wallpaperIds);
        newWallpapers.forEach((wallpaper) => newIds.add(wallpaper.$id));
        console.log(`Updated wallpaperIds, new count: ${newIds.size}`);
        setWallpaperIds(newIds);
      }

      // Update the wallpapers array
      if (shouldRefresh) {
        console.log(`Setting ${newWallpapers.length} wallpapers (refresh)`);
        setWallpapers(newWallpapers);
      } else {
        console.log(
          `Adding ${newWallpapers.length} new wallpapers to existing ${wallpapers.length}`
        );
        setWallpapers((prev) => [...prev, ...newWallpapers]);
      }
    } catch (error) {
      console.error("Error fetching wallpapers:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWallpapers(true);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setNextCursor(null); // Clear cursor on refresh
    setHasMore(true);
    setWallpaperIds(new Set());
    fetchWallpapers(true);
  }, []);

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
      fetchWallpapers(false);
    }, 300);
  }, [loadingMore, hasMore, refreshing, nextCursor]);

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
      isFetchingRef.current = true;
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
          No more wallpapers available
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
        <StatusBar style={isDarkTheme ? "light" : "dark"} />
        <ActivityIndicator
          size="large"
          color={isDarkTheme ? "#fff" : "tomato"}
        />
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
        <StatusBar style={isDarkTheme ? "light" : "dark"} />
        <Text style={[styles.errorText, { color: currentTheme.text }]}>
          Server Under Maintainance, Please Try Again in a While!
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchWallpapers(true)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <StatusBar style={isDarkTheme ? "light" : "dark"} />
      <Header />
      <NotificationPrompt />
      <FlatList
        data={wallpapers}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View style={{ margin: CARD_MARGIN }}>
            <ImageCard
              imageUrl={item.imageUrl}
              wallpaperName={item.title}
              id={item.$id} // Pass the ID to ImageCard
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
            tintColor="tomato"
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  listContainer: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: CONTAINER_PADDING,
    alignItems: "center",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontFamily: "Outfit-Regular",
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "tomato",
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
  },
  endMessage: {
    textAlign: "center",
    padding: 10,
    fontFamily: "Outfit-Regular",
  },
});

export default Home;
