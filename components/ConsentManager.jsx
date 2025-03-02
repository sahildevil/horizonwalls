import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CONSENT_KEY = "user_ad_consent";
const LOCATION_CHECK_KEY = "user_location_check";

// List of EU/EEA country codes that require GDPR consent
const EU_COUNTRY_CODES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IS",
  "IE",
  "IT",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "GB",
  "UK", // Including GB/UK for broader coverage
];

const ConsentManager = ({ onConsentDetermined }) => {
  const [showConsentPrompt, setShowConsentPrompt] = useState(false);

  useEffect(() => {
    checkLocationAndConsent();
  }, []);

  const checkLocationAndConsent = async () => {
    try {
      // First check if we already have stored consent
      const storedConsent = await AsyncStorage.getItem(CONSENT_KEY);

      if (storedConsent !== null) {
        // We already have the user's consent decision
        console.log("Using stored consent:", storedConsent);
        onConsentDetermined(JSON.parse(storedConsent));
        return;
      }

      // Check if we've already determined if the user is in the EU
      const locationCheck = await AsyncStorage.getItem(LOCATION_CHECK_KEY);

      if (locationCheck !== null) {
        const { isEuUser, timestamp } = JSON.parse(locationCheck);

        // Check if the location check is recent (within 30 days)
        const isRecent = Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000;

        if (isRecent) {
          if (isEuUser) {
            // EU user, need consent
            setShowConsentPrompt(true);
          } else {
            // Non-EU user, use personalized ads by default
            console.log("Non-EU user, using personalized ads by default");
            await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(true));
            onConsentDetermined(true);
          }
          return;
        }
      }

      // If we get here, we need to check the user's location
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        const country = data.country_code;

        console.log("User country detected:", country);

        const isEuUser = EU_COUNTRY_CODES.includes(country);

        // Store the location check result
        await AsyncStorage.setItem(
          LOCATION_CHECK_KEY,
          JSON.stringify({
            isEuUser,
            timestamp: Date.now(),
          })
        );

        if (isEuUser) {
          // EU user, need consent
          setShowConsentPrompt(true);
        } else {
          // Non-EU user, use personalized ads by default
          console.log("Non-EU user, using personalized ads by default");
          await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(true));
          onConsentDetermined(true);
        }
      } catch (error) {
        console.error("Error detecting location:", error);
        // On error, be conservative and ask for consent
        setShowConsentPrompt(true);
      }
    } catch (error) {
      console.error("Error in consent/location flow:", error);
      // Default to non-personalized ads on error
      onConsentDetermined(false);
    }
  };

  const handleConsent = async (allowed) => {
    try {
      await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(allowed));
      setShowConsentPrompt(false);
      onConsentDetermined(allowed);
    } catch (error) {
      console.error("Error saving consent:", error);
      onConsentDetermined(false);
    }
  };

  if (!showConsentPrompt) {
    return null;
  }

  return (
    <View style={styles.consentOverlay}>
      <View style={styles.consentContainer}>
        <Text style={styles.consentTitle}>Personalized Ads</Text>

        <Text style={styles.consentText}>
          We use cookies and data to:
          {"\n\n"}• Show personalized ads based on your interests
          {"\n"}• Measure ad performance
          {"\n"}• Store information about your preferences
          {"\n\n"}
          Do you consent to personalized advertisements?
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={() => handleConsent(false)}
          >
            <Text style={styles.buttonText}>No Thanks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleConsent(true)}
          >
            <Text style={[styles.buttonText, styles.acceptText]}>Allow</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  consentOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  consentContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  consentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  consentText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 5,
  },
  declineButton: {
    backgroundColor: "#f0f0f0",
  },
  acceptButton: {
    backgroundColor: "#ff6347", // tomato color
  },
  buttonText: {
    fontWeight: "600",
    color: "#333",
  },
  acceptText: {
    color: "#fff",
  },
});

export default ConsentManager;
