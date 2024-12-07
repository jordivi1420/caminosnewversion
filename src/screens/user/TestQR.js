import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, ActivityIndicator } from 'react-native';

const TestQR = () => {
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const generateQRCode = async () => {
    setLoading(true);
    const qrValue = "Hello World"; // Dato que deseas codificar
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      qrValue
    )}`;
    setQrImageUrl(apiUrl);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generar QR</Text>
      <TouchableOpacity style={styles.button} onPress={generateQRCode}>
        <Text style={styles.buttonText}>Generar Código QR</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {qrImageUrl ? (
        <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#0288D1',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrImage: {
    marginTop: 20,
    width: 150,
    height: 150,
  },
});

export default TestQR;
