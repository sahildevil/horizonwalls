import {
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import CategoryCard from "../../components/CategoryCard";
import { useTheme } from "../../providers/ThemeProvider";
import { useScrollContext } from "../../providers/ScrollContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL + "/categories";
//const API_URL = "http://192.168.1.3:8000/api/categories";
const Categories = () => {
  const { isDarkTheme, currentTheme } = useTheme();
  const { handleScroll } = useScrollContext();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Categories response:", data);

        // Data is now directly an array from Appwrite
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <View
        style={[styles.loader, { backgroundColor: currentTheme.background }]}
      >
        <ActivityIndicator size="large" color='tomato' />
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
          Error loading categories: {error}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <Text style={[styles.title, { color: currentTheme.text }]}>
        Categories
      </Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.$id} // Changed from _id to $id
        renderItem={({ item }) => (
          <CategoryCard
            name={item.name}
            imageUrl={item.imageUrl} // Changed from image to imageUrl
            id={item.$id} // Changed from _id to $id
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  title: {
    fontFamily: "Outfit-Bold",
    fontSize: 28,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
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
    fontFamily: "Outfit-Regular",
    textAlign: "center",
  },
});

export default Categories;
