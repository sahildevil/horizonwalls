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
import { useTheme } from "../../providers/ThemeProvider";

const { width } = Dimensions.get("window");
const API_URL = process.env.EXPO_PUBLIC_API_URL + "/wallpapers";
//const API_URL = "http://192.168.1.5:8000/api/wallpapers";
const SearchScreen = () => {
  const { isDarkTheme, currentTheme } = useTheme();
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
      const response = await fetch(`${API_URL}?search=${encodedQuery}`, {
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
      //console.log("Search results:", data); // Debug log

      // Appwrite returns an array directly instead of {success, wallpapers} format
      if (Array.isArray(data)) {
        setWallpapers(data);
      } else {
        throw new Error("Invalid response format");
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
      style={[
        styles.wallpaperItem,
        { backgroundColor: currentTheme.cardBackground },
      ]}
      onPress={() => {
        router.push({
          pathname: "/Screens",
          params: {
            imageUrl: encodeURIComponent(item.imageUrl),
            name: encodeURIComponent(item.title),
          },
        });
      }}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.wallpaperImage} />
      <Text style={styles.wallpaperName} numberOfLines={1}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View
        style={[styles.header, { borderBottomColor: currentTheme.borderColor }]}
      >
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
        <Text style={[styles.title, { color: currentTheme.text }]}>Search</Text>
      </View>
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: currentTheme.cardBackground,
            color: currentTheme.text,
          },
          searchQuery && { borderColor: currentTheme.primary, borderWidth: 2 },
        ]}
        placeholder="Search wallpapers by name..."
        value={searchQuery}
        onChangeText={handleSearch}
        placeholderTextColor={currentTheme.secondary}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color='tomato' />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: currentTheme.text }]}>
            {error}
          </Text>
        </View>
      ) : wallpapers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text
            style={[styles.noResultsText, { color: currentTheme.secondary }]}
          >
            {searchQuery ? "No wallpapers found" : "Start typing to search..."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={wallpapers}
          renderItem={renderWallpaperItem}
          keyExtractor={(item) => item.$id}
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
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
    borderRadius: 20,
  },
  title: {
    fontFamily: "Outfit-Bold",
    fontSize: 28,
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
    fontFamily: "Outfit-Regular",
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
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Outfit-Regular",
  },
  noResultsText: {
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Outfit-Regular",
  },
});
