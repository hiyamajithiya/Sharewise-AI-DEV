import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Checkbox,
  IconButton,
  Portal,
  Dialog,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, clearError, enableBiometric } from '../../store/slices/authSlice';
import { theme } from '../../styles/theme';
import { authService } from '../../services/authService';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated, biometricEnabled } = useAppSelector(state => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricDialog, setBiometricDialog] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Show biometric setup dialog for first-time users
      if (!biometricEnabled && biometricAvailable) {
        setBiometricDialog(true);
      }
    }
  }, [isAuthenticated, biometricEnabled, biometricAvailable]);

  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const checkBiometricSupport = async () => {
    const { available } = await authService.checkBiometricSupport();
    setBiometricAvailable(available);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await dispatch(loginUser(formData)).unwrap();
      // Navigation will be handled by the navigator based on auth state
    } catch (err) {
      // Error is handled by useEffect
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricEnabled) {
      Alert.alert('Error', 'Biometric authentication is not enabled');
      return;
    }

    try {
      const success = await authService.authenticateWithBiometric();
      if (success) {
        // Use stored credentials or session token
        const isAuth = await authService.isAuthenticated();
        if (isAuth) {
          // Auto-login successful
        } else {
          Alert.alert('Error', 'Please login with your credentials');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleSetupBiometric = async () => {
    try {
      const success = await authService.enableBiometricAuth();
      if (success) {
        dispatch(enableBiometric());
        Alert.alert('Success', 'Biometric authentication enabled');
      } else {
        Alert.alert('Error', 'Failed to enable biometric authentication');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric setup failed');
    }
    setBiometricDialog(false);
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>ShareWise AI</Text>
          <Text style={styles.subtitle}>Welcome Back</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Email or Username"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              left={<TextInput.Icon icon="email" />}
              style={styles.input}
            />

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
            />

            <View style={styles.optionsRow}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  status={rememberMe ? 'checked' : 'unchecked'}
                  onPress={() => setRememberMe(!rememberMe)}
                />
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </View>

              <Button
                mode="text"
                onPress={navigateToForgotPassword}
                compact
                style={styles.forgotButton}
              >
                Forgot Password?
              </Button>
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>

            {biometricEnabled && (
              <Button
                mode="outlined"
                onPress={handleBiometricLogin}
                icon="fingerprint"
                style={styles.biometricButton}
                contentStyle={styles.buttonContent}
              >
                Sign In with Biometric
              </Button>
            )}
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Button
            mode="text"
            onPress={navigateToRegister}
            compact
            style={styles.registerButton}
          >
            Sign Up
          </Button>
        </View>
      </ScrollView>

      {/* Biometric Setup Dialog */}
      <Portal>
        <Dialog visible={biometricDialog} onDismiss={() => setBiometricDialog(false)}>
          <Dialog.Icon icon="fingerprint" />
          <Dialog.Title>Enable Biometric Login</Dialog.Title>
          <Dialog.Content>
            <Text>
              Would you like to enable biometric authentication for faster and more secure login?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setBiometricDialog(false)}>Skip</Button>
            <Button mode="contained" onPress={handleSetupBiometric}>
              Enable
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  card: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.text,
  },
  forgotButton: {
    marginRight: -theme.spacing.sm,
  },
  loginButton: {
    marginBottom: theme.spacing.md,
  },
  biometricButton: {
    borderColor: theme.colors.primary,
  },
  buttonContent: {
    height: theme.dimensions.buttonHeight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.textSecondary,
  },
  registerButton: {
    marginLeft: theme.spacing.xs,
  },
});

export default LoginScreen;