import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const AboutUs = () => {
  const router = useRouter();

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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back-outline" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>About Us</Text>
      </View>

      <ScrollView style={styles.content}>
        <Image
          source={require("../../assets/images/4.png")}
          style={styles.logo}
        />
        <Text style={styles.appName}>Horizon Walls</Text>
        <Text style={styles.version}>Version 1.0.0</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Developer</Text>
          <Image
            source={{
              uri: "https://res.cloudinary.com/defe2sw6l/image/upload/v1739628732/DSC04886_3_v3u9jg.jpg",
            }}
            style={styles.developerImage}
          />
          <Text style={styles.devTitle}>Sahil Kumar</Text>
          <Text style={styles.sectionText}>
            Hi! I’m Sahil Kumar, a developer passionate about creating beautiful
            and functional apps. This wallpaper app brings you high-quality
            wallpapers to personalize your device. Enjoy and keep your screen
            fresh!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the App</Text>
          <Text style={styles.sectionText}>
            Horizon Walls is your premium destination for high-quality
            wallpapers. Our curated collection features stunning images across
            various categories, perfect for personalizing your device.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <Text style={styles.bulletPoint}>• High-quality wallpapers</Text>
          <Text style={styles.bulletPoint}>• Easy download and set</Text>
          <Text style={styles.bulletPoint}>• Category-based browsing</Text>
          <Text style={styles.bulletPoint}>• Favorites collection</Text>
          <Text style={styles.bulletPoint}>• Search functionality</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.sectionText}>
            For support or inquiries, reach out to us at:{" "}
            <Text style={styles.emailLink} onPress={handleEmailPress}>
              wallshorizon@gmail.com
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: {
    fontFamily: "Outfit-Bold",
    fontSize: 25,
    color: "#1a1a1a",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginVertical: 20,
    borderRadius: 20,
  },
  appName: {
    fontFamily: "Tan-Mon",
    fontSize: 24,
    textAlign: "center",
    color: "#1a1a1a",
  },
  version: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginTop: 5,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 20,
    color: "#1a1a1a",
    marginBottom: 10,
  },
  devTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 20,
    color: "#1a1a1a",
    marginBottom: 5,
    textAlign: "center",
  },
  sectionText: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
  },
  bulletPoint: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
    marginLeft: 10,
    marginBottom: 5,
  },
  emailLink: {
    fontFamily: "Outfit-Medium",
    fontSize: 16,
    color: "#4285F4",
    textDecorationLine: "underline",
  },
  developerImage: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginVertical: 10,
    borderRadius: 75, // Makes it circular
    borderWidth: 3,
    borderColor: "black",
  },
});

export default AboutUs;
