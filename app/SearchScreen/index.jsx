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
} from "react-native";

const { width } = Dimensions.get("window");

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [wallpapers, setWallpapers] = useState([]);

  // Mock data for wallpapers (replace with actual API call)
  const mockWallpapers = [
    { id: "1", url: "https://via.placeholder.com/300" },
    { id: "2", url: "https://via.placeholder.com/300" },
    { id: "3", url: "https://via.placeholder.com/300" },
    { id: "4", url: "https://via.placeholder.com/300" },
    { id: "5", url: "https://via.placeholder.com/300" },
    { id: "6", url: "https://via.placeholder.com/300" },
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Here you would typically make an API call to fetch wallpapers based on the query
    // For now, we'll just filter the mock data
    const filteredWallpapers = mockWallpapers.filter((wallpaper) =>
      wallpaper.id.includes(query)
    );
    setWallpapers(filteredWallpapers);
  };

  const renderWallpaperItem = ({ item }) => (
    <TouchableOpacity style={styles.wallpaperItem}>
      <Image source={{ uri: item.url }} style={styles.wallpaperImage} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for wallpapers..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={wallpapers.length > 0 ? wallpapers : mockWallpapers}
        renderItem={renderWallpaperItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.wallpaperList}
      />
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  wallpaperList: {
    justifyContent: "space-between",
  },
  wallpaperItem: {
    width: width / 2 - 24,
    height: width / 2 - 24,
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  wallpaperImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
