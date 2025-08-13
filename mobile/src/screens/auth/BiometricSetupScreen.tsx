import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../styles/theme';

const BiometricSetupScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Icon name="fingerprint" size={80} color={theme.colors.primary} />
      <Text style={styles.title}>Enable Biometric Login</Text>
      <Text style={styles.description}>
        Use your fingerprint or face ID for quick and secure access to your account.
      </Text>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.feature}>🔒 Enhanced Security</Text>
          <Text style={styles.feature}>⚡ Quick Access</Text>
          <Text style={styles.feature}>🛡️ Privacy Protection</Text>
        </Card.Content>
      </Card>
      <Button mode="contained" style={styles.button}>
        Enable Biometric Login
      </Button>
      <Button mode="text">Skip for Now</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  description: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  card: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  cardContent: {
    alignItems: 'center',
  },
  feature: {
    fontSize: 16,
    marginBottom: theme.spacing.sm,
  },
  button: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
});

export default BiometricSetupScreen;