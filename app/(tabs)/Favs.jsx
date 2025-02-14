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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { margin: CARD_MARGIN }]}
      onPress={() => {
        router.push({
          pathname: "/Screens",
          params: {
            imageUrl: encodeURIComponent(item.imageUrl),
            name: encodeURIComponent(item.name),
          },
        });
      }}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favorite Wallpapers</Text>
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No favorite wallpapers yet</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.addedAt}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
