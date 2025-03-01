import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Text,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ImageCard from "../../components/ImageCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../providers/ThemeProvider";

const API_URL = process.env.EXPO_PUBLIC_API_URL + "/wallpapers";
//const API_URL = "http://192.168.1.3:8000/api/wallpapers";
const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const CONTAINER_PADDING = 16;
const NUMBER_OF_COLUMNS = 2;

// Calculate card width and height
const CARD_WIDTH =
  (width - CONTAINER_PADDING * 2 - CARD_MARGIN * (NUMBER_OF_COLUMNS + 1)) /
  NUMBER_OF_COLUMNS;
const CARD_HEIGHT = (CARD_WIDTH * 16) / 9;

const CategoryDetails = () => {
  const { id, name } = useLocalSearchParams();
  const { isDarkTheme, currentTheme } = useTheme();
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCategoryWallpapers = async () => {
      try {
        console.log("Fetching wallpapers for category:", id);
        const response = await fetch(`${API_URL}?category=${id}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Category wallpapers count:", data.length);

        // Data is now directly an array from Appwrite
        setWallpapers(data);
      } catch (error) {
        console.error("Error fetching category wallpapers:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryWallpapers();
  }, [id]);

  if (loading) {
    return (
      <View
        style={[styles.loader, { backgroundColor: currentTheme.background }]}
      >
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: currentTheme.background },
        ]}
      >
        <Text style={[styles.errorText, { color: currentTheme.text }]}>
          Error loading wallpapers: {error}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          marginLeft: 10,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={currentTheme.text}
          />
        </TouchableOpacity>

        <Text style={[styles.title, { color: currentTheme.text }]}>{name}</Text>
      </View>

      <FlatList
        data={wallpapers}
        keyExtractor={(item) => item.$id} // Changed from _id to $id
        renderItem={({ item }) => (
          <View style={{ margin: CARD_MARGIN }}>
            <ImageCard
              imageUrl={item.imageUrl} // Changed from image to imageUrl
              wallpaperName={item.title} // Changed from name to title
              style={[
                styles.card,
                { backgroundColor: currentTheme.cardBackground },
              ]}
            />
          </View>
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
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    marginHorizontal: 20,
    marginBottom: 0,
  },
  listContainer: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: CONTAINER_PADDING,
    alignItems: "center", // Center cards horizontally
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
    textAlign: "center",
    fontFamily: "Outfit-Regular",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
});

export default CategoryDetails;
