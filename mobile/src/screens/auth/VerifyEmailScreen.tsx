import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { verifyEmail } from '../../store/slices/authSlice';
import { theme } from '../../styles/theme';

const VerifyEmailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector(state => state.auth);

  const [otp, setOtp] = useState('');
  const email = route.params?.email;

  const handleVerify = async () => {
    try {
      await dispatch(verifyEmail({ email, otp })).unwrap();
      // Navigation handled by AppNavigator
    } catch (error) {
      // Handle error
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        We've sent a verification code to {email}
      </Text>
      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Verification Code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleVerify}
            loading={loading}
            disabled={!otp}
            style={styles.button}
          >
            Verify Email
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.md,
  },
});

export default VerifyEmailScreen;