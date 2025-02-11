import {
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import ImageCard from "../../components/ImageCard";
import { StatusBar } from "expo-status-bar";

// const API_URL = "https://horizonwalls-server.vercel.app/api/wallpapers";
// Change the API URL to local development server
// const API_URL = "http://localhost:8000/api/wallpapers";
// Replace localhost with your computer's IP address
const API_URL = "http://192.168.1.11:8000/api/wallpapers"; // Replace X with your actual IP

const Home = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWallpapers = async () => {
      try {
        console.log("Fetching wallpapers...");
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched Data:", data);

        // Check if the response has the expected structure
        if (!data.success || !Array.isArray(data.wallpapers)) {
          throw new Error("Invalid data structure received from API");
        }

        // Set the wallpapers array from the nested structure
        setWallpapers(data.wallpapers);
      } catch (error) {
        console.error("Error fetching wallpapers:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

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
        data={wallpapers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          console.log("Rendering image:", item.image, "name:", item.name);
          return <ImageCard imageUrl={item.image} wallpaperName={item.name} />;
        }}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
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
    paddingHorizontal: 10,
    paddingVertical: 10,
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

export default Home;
