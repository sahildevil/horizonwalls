import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useNavigation } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../providers/ThemeProvider";
import { StatusBar } from "expo-status-bar";
import ImageCard from "../../components/ImageCard";

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

const Favs = () => {
  const { isDarkTheme, currentTheme } = useTheme();
  const [favorites, setFavorites] = useState([]);
  const router = useRouter();

  // Use useFocusEffect instead of useEffect
  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      const favoritesData = await AsyncStorage.getItem("favorites");
      console.log("Loaded favorites:", favoritesData); // Debug log
      if (favoritesData) {
        const parsedFavorites = JSON.parse(favoritesData);
        console.log("Parsed favorites:", parsedFavorites); // Debug log
        setFavorites(parsedFavorites);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const renderEmptyList = () => (
    <View
      style={[
        styles.emptyContainer,
        { backgroundColor: currentTheme.background },
      ]}
    >
      <Text style={[styles.emptyText, { color: currentTheme.secondary }]}>
        No favorite wallpapers yet
      </Text>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <StatusBar style={isDarkTheme ? "light" : "dark"} />
      <Text style={[styles.title, { color: currentTheme.text }]}>
        Favorite Wallpapers
      </Text>
      <FlatList
        data={favorites}
        keyExtractor={(item, index) => `favorite-${index}`}
        renderItem={({ item }) => (
          <View style={{ margin: CARD_MARGIN }}>
            <ImageCard
              imageUrl={item.imageUrl} // Already using imageUrl which is good
              wallpaperName={item.name} // Using name field which is saved in AsyncStorage
              style={styles.card}
            />
          </View>
        )}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
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
    fontFamily: "Outfit-Bold",
    fontSize: 28,
    marginHorizontal: 20,
    marginBottom: 15,
    color: "#1a1a1a",
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
  image: {
    width: "100%",
    height: "100%",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    color: "#666",
  },
});

export default Favs;
