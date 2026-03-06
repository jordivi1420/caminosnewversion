import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';
import { Ionicons } from "@expo/vector-icons";

const QRCodeScanner = ({
  qrScanned,
  setQrScanned,
  handleQRScanSuccess,
  setShowQRScanner,
  showQRScanner,
}) => {
  const [facing, setFacing] = useState(CameraType.back);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const toggleCameraType = () => {
    setFacing((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={showQRScanner}
        onRequestClose={() => setShowQRScanner(false)}
      >
        <SafeAreaView style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Permiso de cámara requerido</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a la cámara para escanear códigos QR o PDF417.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Conceder permiso</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowQRScanner(false)}
          >
            <Text style={styles.secondaryButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={showQRScanner}
      onRequestClose={() => setShowQRScanner(false)}
    >
      <View style={styles.container}>
        <CameraView
          onBarcodeScanned={qrScanned ? undefined : handleQRScanSuccess}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "pdf417"],
          }}
          style={styles.camera}
          facing={facing}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header flotante */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.topButton}
                onPress={() => setShowQRScanner(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.topTitle}>Escanear código</Text>

              <TouchableOpacity
                style={styles.topButton}
                onPress={toggleCameraType}
              >
                <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Overlay */}
            <View style={styles.overlay}>
              <View style={styles.overlayTop} />

              <View style={styles.overlayCenter}>
                <View style={styles.overlaySide} />

                <View style={styles.scanAreaWrapper}>
                  <View style={styles.scanArea}>
                    <View style={[styles.corner, styles.cornerTopLeft]} />
                    <View style={[styles.corner, styles.cornerTopRight]} />
                    <View style={[styles.corner, styles.cornerBottomLeft]} />
                    <View style={[styles.corner, styles.cornerBottomRight]} />
                  </View>

                  <Text style={styles.scanHint}>
                    Alinea el código dentro del recuadro
                  </Text>
                </View>

                <View style={styles.overlaySide} />
              </View>

              <View style={styles.overlayBottom} />
            </View>

            {/* Mensaje inferior */}
            <View style={styles.bottomInfo}>
              {qrScanned ? (
                <View style={styles.detectedBox}>
                  <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                  <Text style={styles.detectedText}>Código detectado</Text>
                </View>
              ) : (
                <Text style={styles.bottomText}>
                  Compatible con QR y PDF417
                </Text>
              )}
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  camera: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
  },

  topButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  topTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },

  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },

  overlayCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },

  scanAreaWrapper: {
    alignItems: 'center',
  },

  scanArea: {
    width: 240,
    height: 240,
    backgroundColor: 'transparent',
    position: 'relative',
  },

  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: '#fff',
  },

  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },

  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },

  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },

  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },

  scanHint: {
    marginTop: 16,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },

  bottomInfo: {
    position: 'absolute',
    bottom: 26,
    left: 20,
    right: 20,
    alignItems: 'center',
  },

  bottomText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },

  detectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },

  detectedText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  permissionContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  permissionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },

  permissionText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },

  primaryButton: {
    backgroundColor: '#0B74FF',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    marginBottom: 10,
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },

  secondaryButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default QRCodeScanner;