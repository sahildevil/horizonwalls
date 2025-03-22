import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ToastAndroid,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Client, Account, Databases, Query, Storage } from "appwrite";
import { databases } from "../services/appwrite";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const NOTIFICATIONS_COLLECTION_ID = process.env.EXPO_PUBLIC_NOTIFICATIONS_COLLECTION_ID;

const NotificationPrompt = ({ triggerManually = false, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkPromptStatus = async () => {
      if (!triggerManually) {
        const hasPrompted = await AsyncStorage.getItem(
          "hasPromptedForNotifications"
        );
        if (!hasPrompted) {
          setIsVisible(true); // Show the popup if the user hasn't been prompted yet
        }
      } else {
        setIsVisible(true); // Show the popup when triggered manually
      }
    };

    checkPromptStatus();
  }, [triggerManually]);

  const handleYes = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === "granted") {
        ToastAndroid.show(
          "Great! You'll get new Wallpaper Alerts!",
          ToastAndroid.SHORT
        );

        // Get the push token
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("Push Token:", token);

        // Check if the token already exists in the Appwrite collection
        const existingTokens = await databases.listDocuments(
          DATABASE_ID, // Replace with your database ID
          NOTIFICATIONS_COLLECTION_ID, // Replace with your collection ID
          [Query.equal("token", token)] // Query to check for duplicate tokens
        );

        if (existingTokens.total === 0) {
          // Save the token if it doesn't already exist
          await databases.createDocument(
            DATABASE_ID,
            NOTIFICATIONS_COLLECTION_ID,
            "unique()", // Use a unique ID for the document
            {
              token: token,
            }
          );

          console.log("Push token saved in Appwrite successfully.");
        } else {
          console.log("Token already exists in Appwrite.");
        }
      } else {
        ToastAndroid.show(
          "Permission Denied. You won't receive notifications.",
          ToastAndroid.SHORT
        );
      }

      await AsyncStorage.setItem("hasPromptedForNotifications", "true");
      setIsVisible(false);
      if (onClose) onClose(); // Notify parent component
    } catch (error) {
      console.error(
        "Error requesting notification permissions or saving token:",
        error
      );
      Alert.alert("Error", "Failed to save notification token.");
    }
  };

  const handleNo = async () => {
    await AsyncStorage.setItem("hasPromptedForNotifications", "true");
    setIsVisible(false);
    if (onClose) onClose(); // Notify parent component
  };

  if (!isVisible) return null;

  return (
    <Modal transparent animationType="fade" visible={isVisible}>
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>Want to receive notifications?</Text>
          <Text style={styles.message}>
            Get notified when new wallpapers are posted!
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.noButton} onPress={handleNo}>
              <Text style={styles.noButtonText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.yesButton} onPress={handleYes}>
              <Text style={styles.yesButtonText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default NotificationPrompt;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  noButton: {
    flex: 1,
    backgroundColor: "#ccc",
    paddingVertical: 10,
    borderRadius: 5,
    marginRight: 10,
    alignItems: "center",
  },
  noButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  yesButton: {
    flex: 1,
    backgroundColor: "tomato",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  yesButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
