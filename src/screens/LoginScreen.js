import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase'; // Importa Firebase Auth

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true); // Muestra el indicador de carga
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuario logueado');
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      setErrorMessage('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false); // Oculta el indicador de carga
    }
  };

  return (
    <View style={styles.container}>
      {/* Imagen superior */}
      <Image
        source={require('../../assets/logo.png')} // Cambia 'logo.png' por la imagen que desees
        style={styles.image}
      />
      <Text style={styles.title}>Iniciar Sesión</Text>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
        onChangeText={(text) => {
          setErrorMessage(''); // Limpia errores al escribir
          setEmail(text);
        }}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        onChangeText={(text) => {
          setErrorMessage(''); // Limpia errores al escribir
          setPassword(text);
        }}
        value={password}
      />
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" /> // Indicador de carga dentro del botón
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerText}>Crear una Cuenta</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  error: {
    color: '#E53935',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: '80%',
  },
  button: {
    backgroundColor: '#FFC107',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    width: '80%',
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD', // Color del botón cuando está deshabilitado
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerButton: {
    marginTop: 20,
  },
  registerText: {
    color: '#0288D1',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
