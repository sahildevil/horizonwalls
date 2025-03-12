import {
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import React, { useEffect, useState } from "react";
import CategoryCard from "../../components/CategoryCard";
import { useTheme } from "../../providers/ThemeProvider";
import { useScrollContext } from "../../providers/ScrollContext";
import { StatusBar } from "expo-status-bar";
import { categoryService } from "../../services/appwrite";

const Categories = () => {
  const { isDarkTheme, currentTheme } = useTheme();
  const { handleScroll } = useScrollContext();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Use the categoryService from your appwrite.js service file
        const categoryData = await categoryService.getCategories();

        console.log("Categories from Appwrite:", categoryData);
        setCategories(categoryData);
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
        <StatusBar style={isDarkTheme ? "light" : "dark"} />
        <ActivityIndicator size="large" color="tomato" />
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
        <StatusBar style={isDarkTheme ? "light" : "dark"} />
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
      <StatusBar style={isDarkTheme ? "light" : "dark"} />
      <Text style={[styles.title, { color: currentTheme.text }]}>
        Categories
      </Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            style={[
              styles.categoryCard,
              { backgroundColor: currentTheme.cardBackground },
            ]}
          />
        )}
        numColumns={1}
        contentContainerStyle={styles.gridContainer}
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
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit-Bold",
    marginBottom: 20,
    marginLeft: 16,
  },
  gridContainer: {
    padding: 16,
  },
  categoryCard: {
    flex: 1,
    margin: 8,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    overflow: "hidden",
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
