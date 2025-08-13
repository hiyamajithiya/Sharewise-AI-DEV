import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../styles/theme';

const PortfolioScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portfolio</Text>
      <Text>Portfolio overview and holdings will be displayed here.</Text>
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
});

export default PortfolioScreen;