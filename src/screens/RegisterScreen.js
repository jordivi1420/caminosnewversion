import React, { useMemo, useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "../services/firebase";
import { Ionicons } from "@expo/vector-icons";

const EMAIL_DOMAIN = "@uniguajira.edu.co";

const COLORS = {
  text: "#1F2937",
  muted: "#6B7280",
  yellow: "#F4B41A",
  red: "#E95454",
  teal: "#00A8B5",
  white: "#FFFFFF",
  border: "#E5E7EB",
  error: "#E53935",
  success: "#16A34A",
  warning: "#D97706",
  overlay: "rgba(0, 0, 0, 0.32)",
  cardOverlay: "rgba(255, 255, 255, 0.94)",
  soft: "#F8FAFC",
  softTeal: "#E6F7F9",
  inputFocus: "#BFECEF",
};

const normalizeEmailLocalPart = (value = "") => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/@uniguajira\.edu\.co$/i, "")
    .replace(/@.*$/, "");
};

const validateName = (value) => {
  const clean = value.trim();

  if (!clean) return "El nombre es obligatorio.";
  if (clean.length < 3) return "Ingresa tu nombre completo.";
  return "";
};

const validateEmailLocal = (value) => {
  const clean = normalizeEmailLocalPart(value);

  if (!clean) return "Ingresa tu correo institucional.";
  if (!/^[a-z0-9._-]+$/i.test(clean)) {
    return "Solo puedes usar letras, números, puntos, guiones y guion bajo.";
  }

  return "";
};

const validateCedula = (value) => {
  const clean = value.trim();

  if (!clean) return "La cédula es obligatoria.";
  if (!/^\d+$/.test(clean)) return "La cédula debe contener solo números.";
  if (clean.length < 6) return "La cédula parece incompleta.";
  return "";
};

const validatePassword = (value) => {
  if (!value) return "La contraseña es obligatoria.";
  if (value.length < 6) return "Debe tener al menos 6 caracteres.";
  if (!/[A-Z]/.test(value)) return "Agrega al menos una letra mayúscula.";
  if (!/\d/.test(value)) return "Agrega al menos un número.";
  return "";
};

const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return "Confirma tu contraseña.";
  if (password !== confirmPassword) return "Las contraseñas no coinciden.";
  return "";
};

const getPasswordChecks = (password) => {
  return [
    {
      label: "Mínimo 6 caracteres",
      valid: password.length >= 6,
    },
    {
      label: "Una letra mayúscula",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "Un número",
      valid: /\d/.test(password),
    },
  ];
};

const getPasswordStrength = (password) => {
  let score = 0;

  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;

  if (score <= 1) {
    return { label: "Débil", level: 1 };
  }
  if (score === 2) {
    return { label: "Aceptable", level: 2 };
  }
  if (score === 3) {
    return { label: "Buena", level: 3 };
  }
  return { label: "Segura", level: 4 };
};

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: "",
    emailLocal: "",
    cedula: "",
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({
    name: false,
    emailLocal: false,
    cedula: false,
    password: false,
    confirmPassword: false,
  });

  const [focusedField, setFocusedField] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fullEmail = useMemo(() => {
    const local = normalizeEmailLocalPart(form.emailLocal);
    return local ? `${local}${EMAIL_DOMAIN}` : EMAIL_DOMAIN;
  }, [form.emailLocal]);

  const errors = useMemo(() => {
    return {
      name: validateName(form.name),
      emailLocal: validateEmailLocal(form.emailLocal),
      cedula: validateCedula(form.cedula),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(
        form.password,
        form.confirmPassword,
      ),
    };
  }, [form]);

  const passwordChecks = useMemo(
    () => getPasswordChecks(form.password),
    [form.password],
  );

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password],
  );

  const hasErrors = Object.values(errors).some(Boolean);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]:
        field === "emailLocal"
          ? normalizeEmailLocalPart(value)
          : field === "cedula"
            ? value.replace(/[^\d]/g, "")
            : value,
    }));

    if (errorMessage) setErrorMessage("");
  };

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleRegister = async () => {
    const nextTouched = {
      name: true,
      emailLocal: true,
      cedula: true,
      password: true,
      confirmPassword: true,
    };

    setTouched(nextTouched);
    setErrorMessage("");

    if (hasErrors) {
      Alert.alert(
        "Formulario incompleto",
        "Revisa los campos marcados e inténtalo nuevamente.",
      );
      return;
    }

    const cleanName = form.name.trim();
    const cleanCedula = form.cedula.trim();
    const cleanEmail = fullEmail;
    const cleanPassword = form.password;

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        cleanPassword,
      );

      const user = userCredential.user;

      const userRef = ref(database, `users/${user.uid}`);
      await set(userRef, {
        name: cleanName,
        email: cleanEmail,
        cedula: cleanCedula,
        createdAt: new Date().toISOString(),
        role: "user",
      });

      // No navegues manualmente aquí.
      // Tu AppNavigator debe detectar auth + role y abrir UserNavigator solo.
    } catch (error) {
      console.error(error);

      if (error?.code === "auth/email-already-in-use") {
        setErrorMessage("Este correo institucional ya está registrado.");
      } else if (error?.code === "auth/invalid-email") {
        setErrorMessage("El correo institucional no es válido.");
      } else if (error?.code === "auth/weak-password") {
        setErrorMessage("La contraseña es demasiado débil.");
      } else {
        setErrorMessage(
          "No se pudo completar el registro. Intenta nuevamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (fieldName) => {
    const isFocused = focusedField === fieldName;
    const hasFieldError = touched[fieldName] && errors[fieldName];

    return [
      styles.input,
      isFocused && styles.inputFocused,
      hasFieldError && styles.inputError,
    ];
  };

  return (
    <ImageBackground
      source={require("../../assets/university-bg.jpg")}
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroBox}>
              <Text style={styles.eyebrow}>Universidad de La Guajira</Text>
              <Text style={styles.heroTitle}>Crea tu cuenta</Text>
              <Text style={styles.heroSubtitle}>
                Regístrate con tu correo institucional para solicitar rutas,
                generar tu QR y acceder al sistema.
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.topAccent} />

              <Text style={styles.formTitle}>Registro de estudiante</Text>
              <Text style={styles.formSubtitle}>
                Completa tus datos para continuar
              </Text>

              {errorMessage ? (
                <Text style={styles.globalError}>{errorMessage}</Text>
              ) : null}

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Nombre completo</Text>
                <TextInput
                  style={getInputStyle("name")}
                  placeholder="Ej. Juan David Pérez"
                  placeholderTextColor="#94A3B8"
                  value={form.name}
                  onChangeText={(text) => updateField("name", text)}
                  onBlur={() => {
                    markTouched("name");
                    setFocusedField("");
                  }}
                  onFocus={() => setFocusedField("name")}
                />
                {touched.name && errors.name ? (
                  <Text style={styles.fieldError}>{errors.name}</Text>
                ) : null}
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Correo institucional</Text>

                <View
                  style={[
                    styles.modernInputShell,
                    focusedField === "emailLocal" &&
                      styles.modernInputShellFocused,
                    touched.emailLocal &&
                      errors.emailLocal &&
                      styles.modernInputShellError,
                  ]}
                >
                  <View style={styles.leftIconBox}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={COLORS.teal}
                    />
                  </View>

                  <TextInput
                    style={styles.modernTextInput}
                    placeholder="usuario"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={form.emailLocal}
                    onChangeText={(text) => updateField("emailLocal", text)}
                    onBlur={() => {
                      markTouched("emailLocal");
                      setFocusedField("");
                    }}
                    onFocus={() => setFocusedField("emailLocal")}
                  />

                  <View style={styles.domainPill}>
                    <Text style={styles.domainPillText}>
                      @uniguajira.edu.co
                    </Text>
                  </View>
                </View>

                {touched.emailLocal && errors.emailLocal ? (
                  <Text style={styles.fieldError}>{errors.emailLocal}</Text>
                ) : (
                  <Text style={styles.helperInline}>
                    Usa únicamente tu usuario institucional
                  </Text>
                )}
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Cédula</Text>
                <TextInput
                  style={getInputStyle("cedula")}
                  placeholder="Ej. 123456789"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={form.cedula}
                  onChangeText={(text) => updateField("cedula", text)}
                  onBlur={() => {
                    markTouched("cedula");
                    setFocusedField("");
                  }}
                  onFocus={() => setFocusedField("cedula")}
                />
                {touched.cedula && errors.cedula ? (
                  <Text style={styles.fieldError}>{errors.cedula}</Text>
                ) : null}
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Contraseña</Text>

                <View
                  style={[
                    styles.modernInputShell,
                    focusedField === "password" &&
                      styles.modernInputShellFocused,
                    touched.password &&
                      errors.password &&
                      styles.modernInputShellError,
                  ]}
                >
                  <View style={styles.leftIconBox}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={COLORS.teal}
                    />
                  </View>

                  <TextInput
                    style={styles.modernTextInput}
                    placeholder="Ingresa tu contraseña"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={form.password}
                    onChangeText={(text) => updateField("password", text)}
                    onBlur={() => {
                      markTouched("password");
                      setFocusedField("");
                    }}
                    onFocus={() => setFocusedField("password")}
                  />

                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={22}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.strengthWrapper}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((item) => (
                      <View
                        key={item}
                        style={[
                          styles.strengthBar,
                          passwordStrength.level >= item &&
                            (passwordStrength.level === 1
                              ? styles.strengthWeak
                              : passwordStrength.level === 2
                                ? styles.strengthFair
                                : passwordStrength.level === 3
                                  ? styles.strengthGood
                                  : styles.strengthStrong),
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.strengthText}>
                    Seguridad:{" "}
                    {form.password ? passwordStrength.label : "Sin definir"}
                  </Text>
                </View>

                <View style={styles.checkList}>
                  {passwordChecks.map((item) => (
                    <View key={item.label} style={styles.checkItem}>
                      <Ionicons
                        name={
                          item.valid ? "checkmark-circle" : "ellipse-outline"
                        }
                        size={15}
                        color={item.valid ? COLORS.success : COLORS.muted}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          styles.checkText,
                          { color: item.valid ? COLORS.success : COLORS.muted },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {touched.password && errors.password ? (
                  <Text style={styles.fieldError}>{errors.password}</Text>
                ) : null}
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Confirmar contraseña</Text>

                <View
                  style={[
                    styles.modernInputShell,
                    focusedField === "confirmPassword" &&
                      styles.modernInputShellFocused,
                    touched.confirmPassword &&
                      errors.confirmPassword &&
                      styles.modernInputShellError,
                  ]}
                >
                  <View style={styles.leftIconBox}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color={COLORS.teal}
                    />
                  </View>

                  <TextInput
                    style={styles.modernTextInput}
                    placeholder="Repite tu contraseña"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    value={form.confirmPassword}
                    onChangeText={(text) =>
                      updateField("confirmPassword", text)
                    }
                    onBlur={() => {
                      markTouched("confirmPassword");
                      setFocusedField("");
                    }}
                    onFocus={() => setFocusedField("confirmPassword")}
                  />

                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-outline" : "eye-off-outline"
                      }
                      size={22}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>

                {touched.confirmPassword && errors.confirmPassword ? (
                  <Text style={styles.fieldError}>
                    {errors.confirmPassword}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={COLORS.white} size="small" />
                    <Text style={styles.buttonText}>Creando cuenta...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Registrarse</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
  style={styles.backToLoginButton}
  onPress={() => navigation.navigate('Login')}
  activeOpacity={0.8}
>
  <Text style={styles.backToLoginText}>← Volver a iniciar sesión</Text>
</TouchableOpacity>

              <Text style={styles.helperText}>
                Tu cuenta se registrará con acceso de estudiante usando tu
                correo institucional.
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
    resizeMode: "cover",
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
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 24,
  },

  heroBox: {
    marginBottom: 18,
  },

  eyebrow: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.4,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 8,
  },

  heroSubtitle: {
    color: "#F8FAFC",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: "92%",
  },

  formCard: {
    backgroundColor: COLORS.cardOverlay,
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
  },

  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: COLORS.teal,
  },

  formTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 4,
  },

  formSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 18,
  },

  globalError: {
    color: COLORS.error,
    marginBottom: 14,
    textAlign: "center",
    fontWeight: "700",
    backgroundColor: "#FEECEC",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  fieldBlock: {
    marginBottom: 14,
  },

  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },

  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    fontSize: 15,
    color: COLORS.text,
  },

  inputFocused: {
    borderColor: COLORS.teal,
    backgroundColor: COLORS.soft,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  emailWrapper: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: "hidden",
  },

  emailInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
  },

  domainBox: {
    backgroundColor: COLORS.softTeal,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },

  domainText: {
    color: COLORS.teal,
    fontWeight: "800",
    fontSize: 12,
  },

  previewText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "600",
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  passwordInput: {
    flex: 1,
  },

  toggleButton: {
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.softTeal,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },

  toggleButtonText: {
    color: COLORS.teal,
    fontWeight: "800",
    fontSize: 12,
  },

  strengthWrapper: {
    marginTop: 10,
  },

  strengthBars: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },

  strengthBar: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },

  strengthWeak: {
    backgroundColor: COLORS.error,
  },

  strengthFair: {
    backgroundColor: COLORS.warning,
  },

  strengthGood: {
    backgroundColor: COLORS.yellow,
  },

  strengthStrong: {
    backgroundColor: COLORS.success,
  },

  strengthText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "700",
  },

  checkList: {
    marginTop: 10,
    gap: 5,
  },

  checkItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkIcon: {
    fontSize: 12,
    marginRight: 8,
  },

  checkText: {
    fontSize: 12,
    fontWeight: "600",
  },

  fieldError: {
    color: COLORS.error,
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
  },

  button: {
    backgroundColor: COLORS.teal,
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 16,
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 16,
  },

  helperText: {
    marginTop: 12,
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },

  modernInputShell: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.98)',
  borderWidth: 1.4,
  borderColor: '#D1D5DB',
  borderRadius: 20,
  minHeight: 58,
  paddingHorizontal: 8,
},

modernInputShellFocused: {
  borderColor: COLORS.teal,
  backgroundColor: '#F8FEFF',
  shadowColor: COLORS.teal,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 3,
},

modernInputShellError: {
  borderColor: COLORS.error,
},

leftIconBox: {
  width: 42,
  alignItems: 'center',
  justifyContent: 'center',
},

modernTextInput: {
  flex: 1,
  color: COLORS.text,
  fontSize: 16,
  fontWeight: '600',
  paddingVertical: 14,
},

domainPill: {
  backgroundColor: '#EEFDFC',
  borderWidth: 1,
  borderColor: '#CDEFED',
  paddingHorizontal: 12,
  paddingVertical: 9,
  borderRadius: 14,
  marginRight: 6,
},

domainPillText: {
  color: COLORS.teal,
  fontSize: 12,
  fontWeight: '800',
},

eyeButton: {
  width: 42,
  alignItems: 'center',
  justifyContent: 'center',
},

helperInline: {
  marginTop: 7,
  fontSize: 12,
  color: COLORS.muted,
  fontWeight: '600',
},
backToLoginButton: {
  marginTop: 14,
  alignSelf: 'center',
  paddingVertical: 8,
  paddingHorizontal: 12,
},

backToLoginText: {
  color: COLORS.teal,
  fontSize: 14,
  fontWeight: '800',
},
});

export default RegisterScreen;
