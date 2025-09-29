import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  Portal,
  Modal,
  IconButton,
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDashboard, fetchPerformance } from '../../store/slices/tradingSlice';
import { fetchPortfolio } from '../../store/slices/portfolioSlice';
import { fetchIndices, fetchWatchlist } from '../../store/slices/marketSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import { theme } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  
  const { user } = useAppSelector(state => state.auth);
  const { dashboard } = useAppSelector(state => state.trading);
  const { portfolio } = useAppSelector(state => state.portfolio);
  const { indices, watchlist } = useAppSelector(state => state.market);
  const { unreadCount } = useAppSelector(state => state.notifications);
  
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [dispatch]);

  const loadDashboardData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchDashboard()).unwrap(),
        dispatch(fetchPortfolio()).unwrap(),
        dispatch(fetchIndices()).unwrap(),
        dispatch(fetchWatchlist()).unwrap(),
        dispatch(fetchNotifications({ page: 1, unreadOnly: true })).unwrap(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  const navigateToScreen = (screen: string, params?: any) => {
    navigation.navigate(screen, params);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? theme.colors.bull : theme.colors.bear;
  };

  // TODO: Replace with real chart data from API
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [100000, 105000, 98000, 110000, 115000, portfolio?.totalValue || 120000],
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
    style: {
      borderRadius: theme.borderRadius.md,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
            </Text>
            <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              icon="bell"
              size={24}
              onPress={() => navigateToScreen('Notifications')}
              style={unreadCount > 0 ? styles.notificationIconWithBadge : undefined}
            />
            <IconButton
              icon="account-circle"
              size={24}
              onPress={() => navigateToScreen('Settings', { screen: 'Profile' })}
            />
          </View>
        </View>

        {/* Portfolio Summary */}
        <Card style={styles.portfolioCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Portfolio</Text>
            <Text style={styles.portfolioValue}>
              {formatCurrency(portfolio?.totalValue || 0)}
            </Text>
            <View style={styles.portfolioChange}>
              <Text style={[
                styles.changeText,
                { color: getChangeColor(portfolio?.dayChangePercent || 0) }
              ]}>
                {formatCurrency(portfolio?.dayChange || 0)} ({formatPercentage(portfolio?.dayChangePercent || 0)})
              </Text>
              <Text style={styles.todayLabel}>Today</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Portfolio Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Portfolio Performance</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, { flex: 1, marginRight: theme.spacing.xs }]}>
            <Card.Content style={styles.statContent}>
              <Icon name="chart-line" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{dashboard?.totalSignals || 0}</Text>
              <Text style={styles.statLabel}>Signals</Text>
            </Card.Content>
          </Card>
          
          <Card style={[styles.statCard, { flex: 1, marginHorizontal: theme.spacing.xs }]}>
            <Card.Content style={styles.statContent}>
              <Icon name="check-circle" size={24} color={theme.colors.success} />
              <Text style={styles.statValue}>{dashboard?.executedSignals || 0}</Text>
              <Text style={styles.statLabel}>Executed</Text>
            </Card.Content>
          </Card>
          
          <Card style={[styles.statCard, { flex: 1, marginLeft: theme.spacing.xs }]}>
            <Card.Content style={styles.statContent}>
              <Icon name="clock" size={24} color={theme.colors.warning} />
              <Text style={styles.statValue}>{dashboard?.pendingOrders || 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Market Indices */}
        <Card style={styles.indicesCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Market Indices</Text>
            {indices.slice(0, 3).map((index, i) => (
              <View key={i} style={styles.indexRow}>
                <Text style={styles.indexName}>{index.name}</Text>
                <View style={styles.indexValues}>
                  <Text style={styles.indexValue}>{index.value.toFixed(2)}</Text>
                  <Text style={[
                    styles.indexChange,
                    { color: getChangeColor(index.changePercent) }
                  ]}>
                    {formatPercentage(index.changePercent)}
                  </Text>
                </View>
              </View>
            ))}
            <Button
              mode="text"
              onPress={() => navigateToScreen('Trading')}
              style={styles.viewAllButton}
            >
              View All Markets
            </Button>
          </Card.Content>
        </Card>

        {/* Top Watchlist Items */}
        <Card style={styles.watchlistCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Watchlist</Text>
            {watchlist.slice(0, 4).map((item, i) => (
              <View key={i} style={styles.watchlistRow}>
                <Text style={styles.watchlistSymbol}>{item.symbol}</Text>
                <View style={styles.watchlistValues}>
                  <Text style={styles.watchlistPrice}>₹{item.price.toFixed(2)}</Text>
                  <Text style={[
                    styles.watchlistChange,
                    { color: getChangeColor(item.changePercent) }
                  ]}>
                    {formatPercentage(item.changePercent)}
                  </Text>
                </View>
              </View>
            ))}
            <Button
              mode="text"
              onPress={() => navigateToScreen('Watchlist')}
              style={styles.viewAllButton}
            >
              View Full Watchlist
            </Button>
          </Card.Content>
        </Card>

        {/* AI Studio Access (Pro/Elite users only) */}
        {(user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'ELITE') && (
          <Card style={styles.aiStudioCard}>
            <Card.Content>
              <View style={styles.aiStudioHeader}>
                <Icon name="brain" size={32} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>AI Studio</Text>
              </View>
              <Text style={styles.aiStudioDescription}>
                Create and deploy your own AI trading models
              </Text>
              <Button
                mode="contained"
                onPress={() => navigateToScreen('AIStudio')}
                style={styles.aiStudioButton}
              >
                Open AI Studio
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Bottom spacing for FAB */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <Portal>
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'chart-line-variant',
              label: 'View Signals',
              onPress: () => navigateToScreen('Trading', { screen: 'Signals' }),
            },
            {
              icon: 'eye',
              label: 'Watchlist',
              onPress: () => navigateToScreen('Watchlist'),
            },
            {
              icon: 'newspaper',
              label: 'News',
              onPress: () => navigateToScreen('News'),
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          style={styles.fab}
        />
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  greeting: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerActions: {
    flexDirection: 'row',
  },
  notificationIconWithBadge: {
    backgroundColor: theme.colors.error,
  },
  portfolioCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    ...theme.shadows.medium,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  portfolioValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  portfolioChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: theme.spacing.sm,
  },
  todayLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  chartCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    ...theme.shadows.medium,
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    ...theme.shadows.small,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  indicesCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    ...theme.shadows.medium,
  },
  indexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  indexName: {
    fontSize: 16,
    color: theme.colors.text,
  },
  indexValues: {
    alignItems: 'flex-end',
  },
  indexValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  indexChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  watchlistCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    ...theme.shadows.medium,
  },
  watchlistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  watchlistSymbol: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  watchlistValues: {
    alignItems: 'flex-end',
  },
  watchlistPrice: {
    fontSize: 16,
    color: theme.colors.text,
  },
  watchlistChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  aiStudioCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    backgroundColor: theme.colors.primary + '10',
    ...theme.shadows.medium,
  },
  aiStudioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  aiStudioDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  aiStudioButton: {
    alignSelf: 'flex-start',
  },
  viewAllButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
  },
  bottomSpacing: {
    height: 80, // Space for FAB
  },
  fab: {
    paddingBottom: theme.spacing.lg,
  },
});

export default DashboardScreen;