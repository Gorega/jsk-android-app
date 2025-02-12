import React from "react";
import { StyleSheet, Modal, View, Pressable } from "react-native";

export default function ModalPresentation({ children, showModal, setShowModal, customStyles }) {
  return (
    <Modal
      visible={showModal}
      animationType="fade"
      transparent
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.container}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setShowModal(false)}
        />
        <View style={[styles.main, customStyles]}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  main: {
    position:"absolute",
    backgroundColor: "white",
    width: "95%",
    maxHeight: "60%",
    borderRadius: 15,
    padding: 10
  }
});