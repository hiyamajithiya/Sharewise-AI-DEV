import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';

const TradingScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trading Hub</Text>
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Signals')}
            style={styles.button}
          >
            View Trading Signals
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Orders')}
            style={styles.button}
          >
            My Orders
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Positions')}
            style={styles.button}
          >
            Current Positions
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
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.lg,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  button: {
    marginBottom: theme.spacing.md,
  },
});

export default TradingScreen;