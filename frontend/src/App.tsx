import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, RootState } from './store';
import { getModernTheme } from './utils/modernTheme';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import Portfolio from './pages/Portfolio';
import Strategies from './pages/Strategies';
import Settings from './pages/Settings';
import AIStudio from './pages/AIStudio';
import BrokerIntegration from './pages/BrokerIntegration';
import AdvancedTrading from './pages/AdvancedTrading';
import Analytics from './pages/Analytics';
import CustomTools from './pages/CustomTools';
import UserManagement from './pages/UserManagement';
import TradingMonitor from './pages/TradingMonitor';
import SupportCenter from './pages/SupportCenter';
import SupportTickets from './pages/SupportTickets';
import UserAssistance from './pages/UserAssistance';
import KnowledgeBase from './pages/KnowledgeBase';
import Leads from './pages/Leads';
import SalesAnalytics from './pages/SalesAnalytics';
import Demos from './pages/Demos';

// Import components
import Layout from './components/common/Layout';
import PrivateRoute from './components/common/PrivateRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Import fonts
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

const ThemedApp: React.FC = () => {
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const theme = getModernTheme(themeMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Private routes */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="trading" element={<Trading />} />
            <Route path="advanced-trading" element={<AdvancedTrading />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="strategies" element={<Strategies />} />
            <Route path="broker-integration" element={<BrokerIntegration />} />
            <Route path="ai-studio" element={<AIStudio />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="custom-tools" element={<CustomTools />} />
            <Route path="settings" element={<Settings />} />
            {/* Admin routes */}
            <Route path="users" element={<UserManagement />} />
            <Route path="trading-monitor" element={<TradingMonitor />} />
            <Route path="support-center" element={<SupportCenter />} />
            <Route path="system-settings" element={<Settings />} />
            {/* Support routes */}
            <Route path="support-tickets" element={<SupportTickets />} />
            <Route path="user-assistance" element={<UserAssistance />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            {/* Sales routes */}
            <Route path="leads" element={<Leads />} />
            <Route path="sales-analytics" element={<SalesAnalytics />} />
            <Route path="demos" element={<Demos />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <ThemedApp />
      </PersistGate>
    </Provider>
  );
};

export default App;