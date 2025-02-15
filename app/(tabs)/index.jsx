import {
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Dimensions,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import ImageCard from "../../components/ImageCard";
import { StatusBar } from "expo-status-bar";

const API_URL = "https://horizonwalls-server.vercel.app/api/wallpapers";
//const API_URL = "http://192.168.1.11:8000/api/wallpapers"; // Replace X with your actual IP

const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const CONTAINER_PADDING = 10;
const NUMBER_OF_COLUMNS = 2;

// Calculate card width first
const CARD_WIDTH =
  (width - CONTAINER_PADDING * 2 - CARD_MARGIN * (NUMBER_OF_COLUMNS + 1)) /
  NUMBER_OF_COLUMNS;
// Calculate card height using 9:16 aspect ratio (portrait)
const CARD_HEIGHT = (CARD_WIDTH * 16) / 9;

const Home = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallpapers = async () => {
    try {
      console.log("Fetching wallpapers...");
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched Data:", data);

      if (!data.success || !Array.isArray(data.wallpapers)) {
        throw new Error("Invalid data structure received from API");
      }

      setWallpapers(data.wallpapers);
      setError(null);
    } catch (error) {
      console.error("Error fetching wallpapers:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWallpapers();
  }, []);

  // Polling for updates every 30 seconds
  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     fetchWallpapers();
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(intervalId);
  // }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchWallpapers();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading wallpapers: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header />
      <FlatList
        data={[...wallpapers].reverse()} // Create a reversed copy of the array
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ margin: CARD_MARGIN }}>
            <ImageCard
              imageUrl={item.image}
              wallpaperName={item.name}
              style={styles.card}
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
            colors={["#4285F4"]} // Android
            tintColor="#4285F4" // iOS
          />
        }
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
    alignItems: "center", // Center cards horizontally
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
});

export default Home;
