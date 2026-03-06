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
import Icon from 'react-native-vector-icons/Ionicons';

const ProfileScreen = ({ navigation }) => {
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
        Alert.alert('Error', 'No se pudieron cargar los datos del perfil.');
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

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0288D1" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fondo superior suave */}
      <View style={styles.topBackground} />

      {/* Tarjeta principal */}
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
      </View>

      {/* Opciones */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.option}>
          <View style={styles.optionLeft}>
            <Icon name="person-outline" size={20} color="#0288D1" />
            <Text style={styles.optionText}>Editar perfil</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <View style={styles.optionLeft}>
            <Icon name="lock-closed-outline" size={20} color="#0288D1" />
            <Text style={styles.optionText}>Cambiar contraseña</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <View style={styles.optionLeft}>
            <Icon name="log-out-outline" size={20} color="#E53935" />
            <Text style={[styles.optionText, styles.logoutText]}>Cerrar sesión</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FC',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F8FC',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: '#475569',
  },

  topBackground: {
    height: 120,
    backgroundColor: '#DDF0FF',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  profileCard: {
    marginTop: -55,
    marginHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  profileImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: '#E0F2FE',
  },

  placeholderImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#0288D1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },

  profileName: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },

  profileEmail: {
    marginTop: 4,
    fontSize: 14,
    color: '#64748B',
  },

  optionsContainer: {
    marginTop: 18,
    paddingHorizontal: 18,
    gap: 12,
  },

  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  optionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  logoutText: {
    color: '#E53935',
  },
});

export default ProfileScreen;