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
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import ImageCard from "../../components/ImageCard";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../providers/ThemeProvider";

const API_URL = process.env.EXPO_PUBLIC_API_URL + "/wallpapers";
//const API_URL = "https://horizonwalls-server.vercel.app/api/wallpapers";
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
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchWallpapers = async (pageNum = 1, shouldRefresh = false) => {
    try {
      console.log(`Fetching wallpapers for page ${pageNum}...`);
      const response = await fetch(`${API_URL}?page=${pageNum}&limit=20`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched wallpapers count:", data.length);

      // Update wallpapers state - data is now directly an array from Appwrite
      setWallpapers((prev) => (shouldRefresh ? data : [...prev, ...data]));

      // Check if there are more wallpapers
      setHasMore(data.length === 20);
      setError(null);
    } catch (error) {
      console.error("Error fetching wallpapers:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWallpapers(1, true);
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchWallpapers(1, true);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore && !refreshing) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchWallpapers(nextPage);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="tomato" />
      </View>
    );
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
          Error loading wallpapers: {error}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchWallpapers(1, true)}
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
      <FlatList
        data={wallpapers}
        keyExtractor={(item) => item.$id} // Changed from _id to $id for Appwrite
        renderItem={({ item }) => (
          <View style={{ margin: CARD_MARGIN }}>
            <ImageCard
              imageUrl={item.imageUrl} // Changed from image to imageUrl
              wallpaperName={item.title} // Changed from name to title
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
            tintColor="#4285F4"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
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
});

export default Home;
