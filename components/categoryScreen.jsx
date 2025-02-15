import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Text,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ImageCard from "../../components/ImageCard";

const API_URL = "https://horizonwalls-server.vercel.app/api/wallpapers";

const CategoryDetails = () => {
  const { id, name } = useLocalSearchParams();
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryWallpapers = async () => {
      try {
        console.log("Fetching wallpapers for category:", id);
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
          throw new Error(
            errorData?.error || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        console.log("Fetched Wallpapers:", data);

        if (!data.success) {
          throw new Error("Failed to fetch wallpapers");
        }

        setWallpapers(data.wallpapers || []);
        setError(null);
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

  if (!wallpapers.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{name}</Text>
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            No wallpapers found for this category
          </Text>
        </View>
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
    fontWeight: "bold",
    marginHorizontal: 20,
    marginBottom: 15,
    color: "#1a1a1a",
  },
  listContainer: {
    padding: 15,
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
  },
});

export default CategoryDetails;
