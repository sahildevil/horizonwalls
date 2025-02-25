import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";

const CustomAlert = ({ visible, onClose, onConfirm }) => {
  const { currentTheme } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View
          style={[
            styles.modalView,
            { backgroundColor: currentTheme.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <Feather name="info" size={24} color={currentTheme.primary} />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={currentTheme.closebutton} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.modalTitle, { color: currentTheme.dialogtext }]}>
            Watch Ad to Download
          </Text>
          <Text style={[styles.modalText, { color: currentTheme.dialogtext }]}>
            To download this wallpaper, you'll need to watch a short
            advertisement.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: currentTheme.buttonCancel },
              ]}
              onPress={onClose}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: currentTheme.dialogtext },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: 'tomato' },
              ]}
              onPress={onConfirm}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  { color: 'white' },
                ]}
              >
                Watch Ad
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: Dimensions.get("window").width * 0.85,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  confirmButton: {
    backgroundColor: "tomato",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CustomAlert;
