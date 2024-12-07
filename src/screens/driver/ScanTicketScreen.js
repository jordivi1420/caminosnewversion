import React, { useState } from 'react';
import { View, Text, StyleSheet,TouchableOpacity, Alert } from 'react-native';
import QRCodeScanner from "./QRCodeScanner";

import {Ionicons} from "@expo/vector-icons"

const ScanTicketScreen = () => {

  const [qrData, setQrData] = useState('');
  const [qrScanned, setQrScanned] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleQRScanSuccess = (e) =>{

    setQrData(e.data)
    setQrScanned(true);
    setShowQRScanner(false);
    
    Alert.alert("Código QR Escaneado",`estas aprobado para subir a la ruta: ${e.data}`)
  }

  return (
    <View style={styles.container}>
      {/* Botón para escanear el QR */}
      <TouchableOpacity style={styles.qrButton} onPress={()=>setShowQRScanner(true)}>
                <Ionicons name="qr-code" size={32} color="#002F2F" />
                <Text style={styles.qrButtonText}>{qrScanned ? 'Código QR Escaneado' : 'Escanear Código QR'}</Text>
      </TouchableOpacity>

       {/* QR Scanner Modal */}
       <QRCodeScanner
            handleQRScanSuccess={handleQRScanSuccess}
            qrScanned={qrScanned}
            setQrScanned={setQrScanned}
            setShowQRScanner={setShowQRScanner}
            showQRScanner={showQRScanner}
        />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrButton: {
    alignItems:'center',
    padding:10,
},
qrButtonText: {
  fontSize:16,
  paddingTop:5,
  textAlign:'center'
},
});

export default ScanTicketScreen;
