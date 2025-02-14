import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Text,
  Dimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ImageCard from "../../components/ImageCard";

const API_URL = "http://192.168.1.11:8000/api/wallpapers";
const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CONTAINER_PADDING = 10;
const NUMBER_OF_COLUMNS = 2;

// Calculate card width and height
const CARD_WIDTH = (width - (CONTAINER_PADDING * 2) - (CARD_MARGIN * (NUMBER_OF_COLUMNS + 1))) / NUMBER_OF_COLUMNS;
const CARD_HEIGHT = (CARD_WIDTH * 9) / 16;

const CategoryDetails = () => {
  const { id, name } = useLocalSearchParams();
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryWallpapers = async () => {
      try {
        console.log("Fetching wallpapers for category:", id);
        // Use the wallpapers endpoint with category query parameter
        const response = await fetch(`${API_URL}?category=${id}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error("Server Error Details:", errorData);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched Wallpapers:", data);

        if (!data.success || !Array.isArray(data.wallpapers)) {
          throw new Error("Invalid data structure received from API");
        }

        setWallpapers(data.wallpapers);
      } catch (error) {
        console.error("Error fetching wallpapers:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryWallpapers();
  }, [id]);

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
      <Text style={styles.title}>{name}</Text>
      <FlatList
        data={wallpapers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ImageCard imageUrl={item.image} wallpaperName={item.name} />
        )}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    marginHorizontal: 20,
    marginBottom: 15,
    color: "#1a1a1a",
  },
  listContainer: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: CONTAINER_PADDING,
    alignItems: 'center', // Center cards horizontally
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

export default CategoryDetails;
