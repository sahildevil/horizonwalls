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

const API_URL = "http://192.168.1.11:8000/api/categories";
const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log("Fetching categories...");
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched Categories:", data);

        if (!data.success || !Array.isArray(data.category)) {
          throw new Error("Invalid data structure received from API");
        }

        setCategories(data.category); // Changed from data.categories to data.category
        console.log("Set categories:", data.category); // Debug log
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
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading categories: {error}</Text>
      </View>
    );
  }

  // Debug log to verify data before rendering
  console.log("Rendering categories:", categories);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categories</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          console.log("Rendering category item:", item); // Debug log
          return (
            <CategoryCard
              name={item.name}
              imageUrl={item.image}
              id={item._id}
            />
          );
        }}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 40,
  },
  title: {
    fontFamily: "Outfit-Bold",
    fontSize: 28,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
    color: "#1a1a1a",
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
    color: "red",
    textAlign: "center",
  },
});

export default Categories;
