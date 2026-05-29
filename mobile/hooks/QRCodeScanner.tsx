import React, { useState } from "react";
import {
  View,
  SafeAreaView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { CameraView } from "expo-camera";

interface QRCodeScannerProps {
  onClose: () => void;
  onCodeScanned: (data: string) => boolean;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onClose,
  onCodeScanned,
}) => {
  const [hasScanned, setHasScanned] = useState(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!hasScanned) {
      setHasScanned(true);
      const accepted = onCodeScanned(data);
      if (accepted) {
        onClose();
      } else {
        setHasScanned(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === "android" ? <StatusBar hidden /> : null}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleBarcodeScanned}
      />
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
      <View style={styles.scanArea}></View>
      <Text style={styles.scanText}>Scan QR code</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 300,
    height: 300,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  scanText: {
    color: "white",
    marginTop: 10,
    fontSize: 18,
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  camera: StyleSheet.absoluteFillObject,
});

export default QRCodeScanner;