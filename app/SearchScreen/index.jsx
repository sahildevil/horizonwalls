import React, { useState, useCallback } from "react";
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
import {
  databases,
  DATABASE_ID,
  WALLPAPERS_COLLECTION_ID,
  Query,
} from "../../services/appwrite";
import debounce from "lodash.debounce";

const { width } = Dimensions.get("window");

const SearchScreen = () => {
  const { isDarkTheme, currentTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Create a debounced version of the search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setWallpapers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Searching for:", query);
        console.log(
          "Using database:",
          DATABASE_ID,
          "collection:",
          WALLPAPERS_COLLECTION_ID
        );

        // Use Appwrite SDK to search
        const response = await databases.listDocuments(
          DATABASE_ID,
          WALLPAPERS_COLLECTION_ID,
          [
            Query.search("title", query.trim()),
            Query.limit(20),
            Query.orderDesc("$createdAt"),
          ]
        );

        console.log("Search response:", response);

        if (response && response.documents) {
          console.log(
            `Found ${response.documents.length} results for "${query}"`
          );
          setWallpapers(response.documents);
        } else {
          console.log("No results found or invalid response");
          setWallpapers([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setError(error.message || "Search failed. Please try again.");
        setWallpapers([]);
      } finally {
        setLoading(false);
      }
    }, 500), // 500ms debounce delay
    [] // Empty dependencies to ensure the debounced function is created once
  );

  const handleSearch = (query) => {
    setSearchQuery(query);

    // Clear results immediately if empty
    if (!query.trim()) {
      setWallpapers([]);
      return;
    }

    // Show loading state
    setLoading(true);

    // Execute the debounced search
    debouncedSearch(query);
  };

  // In your wallpaper item rendering:
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
            id: item.$id, // Make sure to pass the ID
          },
        });
      }}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.wallpaperImage}
        // Add a placeholder image
      />
      <Text style={styles.wallpaperName} numberOfLines={1}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  // Display count badge if results are found
  const renderResultCount = () => {
    if (!searchQuery || loading || error || wallpapers.length === 0)
      return null;

    return (
      <Text style={[styles.resultCount, { color: currentTheme.secondary }]}>
        {wallpapers.length} {wallpapers.length === 1 ? "result" : "results"}{" "}
        found
      </Text>
    );
  };

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

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color={currentTheme.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: currentTheme.cardBackground,
              color: currentTheme.text,
              borderColor: searchQuery ? currentTheme.primary : "#ddd",
            },
          ]}
          placeholder="Search wallpapers by name..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={currentTheme.secondary}
          autoFocus={true}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {renderResultCount()}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="tomato" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: currentTheme.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => handleSearch(searchQuery)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
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
          initialNumToRender={6}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  searchIcon: {
    position: "absolute",
    zIndex: 1,
    left: 15,
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 45,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    flex: 1,
  },
  resultCount: {
    marginBottom: 10,
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    textAlign: "center",
  },
  wallpaperList: {
    paddingBottom: 20,
    alignItems: "center",
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
    backgroundColor: "#e0e0e0", // Placeholder color while loading
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
    marginBottom: 15,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Outfit-Regular",
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
});
