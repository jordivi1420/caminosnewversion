import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, database } from '../../services/firebase';
import { ref, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1F2937',
  muted: '#6B7280',

  yellow: '#F4B41A',
  yellowSoft: '#FFF4CC',

  red: '#E95454',
  redSoft: '#FFE4E4',

  teal: '#00A8B5',
  tealSoft: '#DDF7F9',

  border: '#E5E7EB',
  tealBorder: '#BFECEF',
};

const SettingsScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({
    name: 'Cargando...',
    email: 'Cargando...',
    photo: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;

        if (user) {
          const snapshot = await get(ref(database, `users/${user.uid}`));

          if (snapshot.exists()) {
            const data = snapshot.val();

            setUserData({
              name: data.name || 'Usuario',
              email: user.email || 'Sin correo',
              photo: data.photo || null,
            });
          } else {
            setUserData({
              name: 'Usuario',
              email: user.email || 'Sin correo',
              photo: null,
            });
          }
        }
      } catch (error) {
        console.error('Error al cargar los datos del usuario:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos del usuario.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Cierre de sesión', 'Has cerrado sesión correctamente.');
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al cerrar sesión. Inténtalo de nuevo.');
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleEditProfile = () => {
    Alert.alert('Próximamente', 'La edición de perfil estará disponible pronto.');
  };

  const handleChangePassword = () => {
    Alert.alert('Próximamente', 'La opción para cambiar contraseña estará disponible pronto.');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.watermarkLoading}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../../assets/logo.png')}
        style={styles.watermark}
        resizeMode="contain"
      />

      <View style={styles.profileCard}>
        {userData.photo ? (
          <Image source={{ uri: userData.photo }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>
              {userData.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}

        <Text style={styles.profileName}>{userData.name}</Text>
        <Text style={styles.profileEmail}>{userData.email}</Text>

        <View style={styles.userBadge}>
          <Text style={styles.userBadgeText}>Estudiante</Text>
        </View>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionCard} onPress={handleEditProfile}>
          <View style={styles.optionLeft}>
            <View style={[styles.optionIconWrap, { backgroundColor: COLORS.tealSoft }]}>
              <Ionicons name="person-outline" size={20} color={COLORS.teal} />
            </View>
            <View>
              <Text style={styles.optionTitle}>Editar perfil</Text>
              <Text style={styles.optionSubtitle}>Actualiza tu información básica</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={handleChangePassword}>
          <View style={styles.optionLeft}>
            <View style={[styles.optionIconWrap, { backgroundColor: COLORS.yellowSoft }]}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.yellow} />
            </View>
            <View>
              <Text style={styles.optionTitle}>Cambiar contraseña</Text>
              <Text style={styles.optionSubtitle}>Protege el acceso a tu cuenta</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <View style={styles.optionLeft}>
            <View style={[styles.optionIconWrap, { backgroundColor: COLORS.redSoft }]}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
            </View>
            <View>
              <Text style={styles.logoutTitle}>Cerrar sesión</Text>
              <Text style={styles.optionSubtitle}>Salir de tu cuenta actual</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.red} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  watermark: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignSelf: 'center',
    top: 150,
    opacity: 0.05,
  },

  watermarkLoading: {
    position: 'absolute',
    width: 240,
    height: 240,
    opacity: 0.05,
  },

  heroCard: {
    backgroundColor: COLORS.tealSoft,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.tealBorder,
    overflow: 'hidden',
  },

  heroAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: COLORS.red,
  },

  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.teal,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 2,
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },

  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },

  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: COLORS.tealSoft,
  },

  placeholderImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },

  profileName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 14,
    textAlign: 'center',
  },

  profileEmail: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
  },

  userBadge: {
    marginTop: 12,
    backgroundColor: COLORS.yellowSoft,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },

  userBadgeText: {
    color: '#8A5A00',
    fontSize: 12,
    fontWeight: '900',
  },

  optionsContainer: {
    gap: 12,
  },

  optionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  logoutCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FFD0D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },

  optionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  logoutTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.red,
  },

  optionSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
  },
});

export default SettingsScreen;