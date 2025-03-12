import { Client, Account, Databases, Query, Storage } from "appwrite";
import "react-native-url-polyfill/auto";

// Initialize Appwrite client
const client = new Client();

// Replace with your Appwrite endpoint and project ID
client
  .setEndpoint("https://cloud.appwrite.io/v1") // Replace with your Appwrite endpoint
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID); // Replace with your project ID

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Use the same IDs as your server - make sure these are strings
export const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
export const WALLPAPERS_COLLECTION_ID = process.env.EXPO_PUBLIC_WALLPAPERS_COLLECTION_ID;
export const CATEGORIES_COLLECTION_ID = process.env.EXPO_PUBLIC_CATEGORIES_COLLECTION_ID;

// Export Query for use in components
export { Query };

// Service functions for wallpapers
export const wallpaperService = {
  // Get all wallpapers with pagination
  getWallpapers: async (
    limit = 20,
    cursor = null,
    categoryId = null,
    searchQuery = null
  ) => {
    try {
      let queries = [Query.limit(limit), Query.orderDesc("$createdAt")];

      // Add cursor for pagination if provided
      if (cursor) {
        queries.push(Query.cursorAfter(cursor));
      }

      // Filter by category if provided
      if (categoryId) {
        queries.push(Query.equal("categoryId", categoryId));
      }

      // Add search query if provided
      if (searchQuery) {
        queries.push(Query.search("title", searchQuery));
      }

      console.log("Executing wallpaper query with:", {
        DATABASE_ID,
        WALLPAPERS_COLLECTION_ID,
        queries,
      });

      const response = await databases.listDocuments(
        DATABASE_ID,
        WALLPAPERS_COLLECTION_ID,
        queries
      );

      return {
        documents: response.documents,
        pagination: {
          total: response.total,
          nextCursor:
            response.documents.length > 0
              ? response.documents[response.documents.length - 1].$id
              : null,
        },
      };
    } catch (error) {
      console.error("Error fetching wallpapers:", error);
      throw error;
    }
  },

  // Get wallpapers by category
  getWallpapersByCategory: async (categoryId, limit = 20, cursor = null) => {
    try {
      return await this.getWallpapers(limit, cursor, categoryId);
    } catch (error) {
      console.error(
        `Error fetching wallpapers for category ${categoryId}:`,
        error
      );
      throw error;
    }
  },

  // Search wallpapers by query
  searchWallpapers: async (query, limit = 20) => {
    try {
      return await this.getWallpapers(limit, null, null, query);
    } catch (error) {
      console.error(`Error searching wallpapers with query "${query}":`, error);
      throw error;
    }
  },
};

// Service functions for categories
export const categoryService = {
  // Get all categories
  getCategories: async () => {
    try {
      console.log(
        "Fetching categories from DB:",
        DATABASE_ID,
        "Collection:",
        CATEGORIES_COLLECTION_ID
      );

      // Add debug query to check if anything is there
      const response = await databases.listDocuments(
        DATABASE_ID,
        CATEGORIES_COLLECTION_ID,
        [Query.limit(100)]
      );

      console.log("Raw Appwrite categories response:", response);
      console.log("Total categories found:", response.total);

      return response.documents;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  // Get category by ID
  getCategoryById: async (categoryId) => {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        CATEGORIES_COLLECTION_ID,
        categoryId
      );
    } catch (error) {
      console.error(`Error fetching category ${categoryId}:`, error);
      throw error;
    }
  },
};

// Make sure we're exporting everything needed
export default {
  client,
  account,
  databases,
  storage,
  Query,
  DATABASE_ID,
  WALLPAPERS_COLLECTION_ID,
  CATEGORIES_COLLECTION_ID,
  wallpaperService,
  categoryService,
};
