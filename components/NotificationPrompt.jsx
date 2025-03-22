import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
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
        Alert.alert("Success", "You will now receive notifications!");
      } else {
        Alert.alert("Permission Denied", "You won't receive notifications.");
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log("Push Token:", token);

      await AsyncStorage.setItem("hasPromptedForNotifications", "true");
      setIsVisible(false);
      if (onClose) onClose(); // Notify parent component
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
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
