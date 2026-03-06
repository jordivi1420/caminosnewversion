import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../services/firebase';

const COLORS = {
  text: '#1F2937',
  muted: '#6B7280',

  yellow: '#F4B41A',
  red: '#E95454',
  teal: '#00A8B5',

  white: '#FFFFFF',
  border: '#E5E7EB',
  error: '#E53935',
  overlay: 'rgba(0, 0, 0, 0.32)',
  cardOverlay: 'rgba(255, 255, 255, 0.94)',
};

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cedula, setCedula] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    setErrorMessage('');

    if (!name || !email || !password || !cedula) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = ref(database, `users/${user.uid}`);
      await set(userRef, {
        name,
        email,
        cedula,
        createdAt: new Date().toISOString(),
        role: 'user',
      });

      navigation.replace('UserNavigator');
    } catch (error) {
      console.error(error);
      setErrorMessage('Error al registrar el usuario. Intenta nuevamente.');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/university-bg.jpg')}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.heroBox}>
              <Text style={styles.eyebrow}>Universidad de La Guajira</Text>
              <Text style={styles.heroTitle}>Crea tu cuenta</Text>
              <Text style={styles.heroSubtitle}>
                Regístrate para solicitar rutas, generar tu QR y acceder al sistema.
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.topAccent} />

              <Text style={styles.formTitle}>Registro de estudiante</Text>
              <Text style={styles.formSubtitle}>
                Completa tus datos para continuar
              </Text>

              {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                placeholderTextColor="#94A3B8"
                onChangeText={setName}
                value={name}
              />

              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={setEmail}
                value={email}
              />

              <TextInput
                style={styles.input}
                placeholder="Cédula"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                onChangeText={setCedula}
                value={cedula}
              />

              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                onChangeText={setPassword}
                value={password}
              />

              <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Registrarse</Text>
              </TouchableOpacity>

              <Text style={styles.helperText}>
                Tu cuenta se registrará con acceso de estudiante.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  background: {
    flex: 1,
  },

  backgroundImage: {
    resizeMode: 'cover',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },

  heroBox: {
    marginBottom: 18,
  },

  eyebrow: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.4,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 8,
  },

  heroSubtitle: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: '92%',
  },

  formCard: {
    backgroundColor: COLORS.cardOverlay,
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
  },

  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: COLORS.teal,
  },

  formTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
  },

  formSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 16,
  },

  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 16,
    fontSize: 15,
    color: COLORS.text,
  },

  button: {
    backgroundColor: COLORS.teal,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 16,
    marginTop: 4,
  },

  buttonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 16,
  },

  helperText: {
    marginTop: 12,
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  error: {
    color: COLORS.error,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '700',
  },
});

export default RegisterScreen;