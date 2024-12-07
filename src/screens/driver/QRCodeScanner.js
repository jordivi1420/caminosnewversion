import React, { useState, useEffect } from 'react';
import { Text, View, Button, StyleSheet, TouchableOpacity,Modal } from 'react-native';
import { CameraView,useCameraPermissions} from 'expo-camera';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';
 import {Ionicons} from "@expo/vector-icons"

const QRCodeScanner = ({qrScanned,setQrScanned,handleQRScanSuccess,setShowQRScanner,showQRScanner}) => {
  const [facing, setFacing] = useState(CameraType.back)
  const [permission, requestPermission] = useCameraPermissions();


   // Efecto para solicitar permisos cuando la aplicación se carga
   useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission(); // Solicitar el permiso si no está otorgado
    }
  }, [permission]);


  if (!permission) {
    return <View/>;
  }
  

  const toggleCameraType = ()=>{
    setFacing((current) => (current === CameraType.back ? CameraType.front : CameraType.back))
  }
  

  return (
    <Modal 
         animationType="slide"
         transparent={false}
         visible={showQRScanner}
         onRequestClose={()=>setShowQRScanner(false)}
        >
        <View style={styles.container}>
        <CameraView
        onBarcodeScanned={qrScanned ?  undefined :handleQRScanSuccess}
        barcodeScannerSettings={{
            barcodeTypes:["qr","pdf417"]
        }}
        style={styles.camera}
        facing={facing}
        >
          <View style={styles.overlay}>
            <View style={styles.overlayTop}></View>
            <View style={styles.overlayCenter}>
              <View style={styles.overlaySide}></View>
              <View style={styles.focusedFrame}></View>
              <View style={styles.overlaySide}></View>
            </View>
            <View style={styles.overlayBottom}></View>
          </View>
        </CameraView>

            <View style={styles.iconBar}>
                <TouchableOpacity style={styles.iconButton} onPress={toggleCameraType}>
                    <Ionicons name='camera-reverse-outline' size={32} color="white"/>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={() => setShowQRScanner(false)}>
                    <Ionicons name="close-circle-outline" size={32} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
    
  );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor:'black'
      },
      message: {
        textAlign: 'center',
        paddingBottom: 10,
      },
      camera: {
        flex: 1,
      },
      overlay: {
        flex: 1,
        justifyContent: 'space-between',
        position: 'absolute',
        width: '100%',
        height: '100%',
      },
      overlayTop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      },
      overlayCenter: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      overlaySide: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      },
      focusedFrame: {
        width: 200,
        height: 200,
        borderWidth: 2,
        borderColor: 'white',
        backgroundColor: 'transparent',
      },
      overlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      },
      buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64,
      },
      button: {
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center',
      },
      text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
      },
      iconBar: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        padding: 20,
        backgroundColor: 'black',
      },
      iconButton: {
        alignItems: 'center',
        padding: 10,
      },
});

export default QRCodeScanner;
