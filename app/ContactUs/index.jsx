import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../providers/ThemeProvider";

const ContactUs = () => {
  const router = useRouter();
  const { isDarkTheme, currentTheme } = useTheme();

  const handleEmailPress = async () => {
    const email = "wallshorizon@gmail.com";
    const subject = "Horizon Walls Support";
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert("Error", "Could not open email client");
      }
    } catch (error) {
      console.error("Error opening email:", error);
      Alert.alert("Error", "Failed to open email client");
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View
        style={[styles.header, { borderBottomColor: currentTheme.borderColor }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={currentTheme.text}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.text }]}>
          Contact Us
        </Text>
      </View>

      <View style={styles.content}>
        <MaterialCommunityIcons
          name="email-outline"
          size={80}
          color={currentTheme.primary}
        />

        <Text style={[styles.description, { color: currentTheme.secondary }]}>
          Have questions or suggestions? We'd love to hear from you. Send us a
          message and we'll respond as soon as possible.
        </Text>

        <TouchableOpacity
          style={[
            styles.emailButton,
            { backgroundColor: currentTheme.primary },
          ]}
          onPress={handleEmailPress}
        >
          <MaterialCommunityIcons
            name="email-send-outline"
            size={24}
            color="white"
          />
          <Text style={styles.emailButtonText}>wallshorizon@gmail.com</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: {
    fontFamily: "Outfit-Bold",
    fontSize: 28,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  description: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 30,
    lineHeight: 24,
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  emailButtonText: {
    fontFamily: "Outfit-Medium",
    color: "white",
    fontSize: 16,
    marginLeft: 10,
  },
});

export default ContactUs;
