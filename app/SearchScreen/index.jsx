import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const API_URL = "http://192.168.1.11:8000/api/wallpapers"; // Update with your IP

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSearch = async (query) => {
    setSearchQuery(query);

    // Clear results if search is empty
    if (!query.trim()) {
      setWallpapers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Encode the search query and ensure it's trimmed
      const encodedQuery = encodeURIComponent(query.trim());
      const response = await fetch(`${API_URL}?searchValue=${encodedQuery}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Search results:", data); // Debug log

      if (data.success) {
        setWallpapers(data.wallpapers);
      } else {
        throw new Error(data.error || "Failed to fetch wallpapers");
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(error.message);
      setWallpapers([]);
    } finally {
      setLoading(false);
    }
  };

  const renderWallpaperItem = ({ item }) => (
    <TouchableOpacity
      style={styles.wallpaperItem}
      onPress={() => {
        router.push({
          pathname: "/Screens",
          params: {
            imageUrl: encodeURIComponent(item.image),
            name: encodeURIComponent(item.name),
          },
        });
      }}
    >
      <Image source={{ uri: item.image }} style={styles.wallpaperImage} />
      <Text style={styles.wallpaperName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back-outline" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Search</Text>
      </View>
      <TextInput
        style={[styles.searchInput, searchQuery && styles.searchInputActive]}
        placeholder="Search wallpapers by name..."
        value={searchQuery}
        onChangeText={handleSearch}
        placeholderTextColor="#666"
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : wallpapers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noResultsText}>
            {searchQuery ? "No wallpapers found" : "Start typing to search..."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={wallpapers}
          renderItem={renderWallpaperItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.wallpaperList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
    borderRadius: 20,
  },
  title: {
    fontFamily: "Outfit-Bold",
    fontSize: 28,
    color: "#1a1a1a",
    flex: 1,
  },
  searchInput: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
    fontFamily: "Outfit-Regular",
  },
  searchInputActive: {
    borderColor: "#4285F4", // Google Blue accent color
    borderWidth: 2,
  },
  wallpaperList: {
    paddingBottom: 20,
  },
  wallpaperItem: {
    width: width / 2 - 24,
    height: (width / 2 - 24) * 1.5,
    marginHorizontal: 4,
    marginBottom: 16,
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
  wallpaperImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  wallpaperName: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "white",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Outfit-Medium",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Outfit-Regular",
  },
  noResultsText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Outfit-Regular",
  },
});
