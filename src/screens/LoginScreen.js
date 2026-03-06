import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

const COLORS = {
  text: '#1F2937',
  muted: '#6B7280',
  teal: '#00A8B5',
  red: '#E95454',
  white: '#FFFFFF',
  border: '#E5E7EB',
  overlay: 'rgba(0, 0, 0, 0.32)',
  cardOverlay: 'rgba(255, 255, 255, 0.94)',
};

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

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuario logueado');
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      setErrorMessage('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
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
              <Text style={styles.heroTitle}>Bienvenido</Text>
              <Text style={styles.heroSubtitle}>
                Inicia sesión para acceder a tus rutas, tickets y servicios del sistema.
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.topAccent} />

              <Image
                source={require('../../assets/logo.png')}
                style={styles.image}
                resizeMode="contain"
              />

              <Text style={styles.title}>Iniciar sesión</Text>
              <Text style={styles.subtitle}>Ingresa tus datos para continuar</Text>

              {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#94A3B8"
                onChangeText={(text) => {
                  setErrorMessage('');
                  setEmail(text);
                }}
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                onChangeText={(text) => {
                  setErrorMessage('');
                  setPassword(text);
                }}
                value={password}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Iniciar sesión</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.registerText}>Crear una cuenta</Text>
              </TouchableOpacity>
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
    alignItems: 'center',
  },

  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: COLORS.teal,
  },

  image: {
    width: 110,
    height: 110,
    marginBottom: 12,
    marginTop: 6,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 16,
    textAlign: 'center',
  },

  error: {
    color: COLORS.red,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '700',
  },

  input: {
    height: 52,
    width: '100%',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 15,
    color: COLORS.text,
  },

  button: {
    backgroundColor: COLORS.teal,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 16,
    width: '100%',
    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },

  registerButton: {
    marginTop: 16,
  },

  registerText: {
    color: COLORS.teal,
    fontWeight: '800',
    fontSize: 14,
  },
});

export default LoginScreen;