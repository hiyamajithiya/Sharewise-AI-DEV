import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  TrendingUp,
  AccountBalance,
  Psychology,
  ModelTraining,
  Settings,
  Notifications,
  AccountCircle,
  Logout,
  Support,
  AdminPanelSettings,
  People,
  BarChart,
  Assignment,
  ContactSupport,
  Link,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import { selectTestingState } from '../../store/slices/testingSlice';

const drawerWidth = 240;

const roleBasedMenuItems = {
  SUPER_ADMIN: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'User Management', icon: <People />, path: '/users' },
    { text: 'System Analytics', icon: <BarChart />, path: '/analytics' },
    { text: 'Trading Monitor', icon: <TrendingUp />, path: '/trading-monitor' },
    { text: 'Support Center', icon: <Support />, path: '/support-center' },
    { text: 'System Settings', icon: <AdminPanelSettings />, path: '/system-settings' },
  ],
  SUPPORT: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Support Tickets', icon: <Assignment />, path: '/support-tickets' },
    { text: 'User Assistance', icon: <ContactSupport />, path: '/user-assistance' },
    { text: 'Knowledge Base', icon: <Psychology />, path: '/knowledge-base' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ],
  SALES: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Lead Management', icon: <People />, path: '/leads' },
    { text: 'Sales Analytics', icon: <BarChart />, path: '/sales-analytics' },
    { text: 'Customer Demos', icon: <ModelTraining />, path: '/demos' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ],
  USER_BASIC: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Trading', icon: <TrendingUp />, path: '/trading' },
    { text: 'Portfolio', icon: <AccountBalance />, path: '/portfolio' },
    { text: 'Broker Integration', icon: <Link />, path: '/broker-integration' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ],
  USER_PRO: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Trading', icon: <TrendingUp />, path: '/trading' },
    { text: 'Portfolio', icon: <AccountBalance />, path: '/portfolio' },
    { text: 'Strategies', icon: <Psychology />, path: '/strategies' },
    { text: 'Broker Integration', icon: <Link />, path: '/broker-integration' },
    { text: 'AI Studio', icon: <ModelTraining />, path: '/ai-studio' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ],
  USER_ELITE: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Advanced Trading', icon: <TrendingUp />, path: '/advanced-trading' },
    { text: 'Portfolio', icon: <AccountBalance />, path: '/portfolio' },
    { text: 'Strategies', icon: <Psychology />, path: '/strategies' },
    { text: 'Broker Integration', icon: <Link />, path: '/broker-integration' },
    { text: 'AI Studio', icon: <ModelTraining />, path: '/ai-studio' },
    { text: 'Analytics', icon: <BarChart />, path: '/analytics' },
    { text: 'Custom Tools', icon: <AdminPanelSettings />, path: '/custom-tools' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ],
  USER: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Trading', icon: <TrendingUp />, path: '/trading' },
    { text: 'Portfolio', icon: <AccountBalance />, path: '/portfolio' },
    { text: 'Strategies', icon: <Psychology />, path: '/strategies' },
    { text: 'Broker Integration', icon: <Link />, path: '/broker-integration' },
    { text: 'AI Studio', icon: <ModelTraining />, path: '/ai-studio' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ],
};

const getMenuItemsForRole = (role: string, subscriptionTier?: string) => {
  // For USER role, check subscription tier
  if (role === 'USER' && subscriptionTier) {
    const tierKey = `USER_${subscriptionTier}` as keyof typeof roleBasedMenuItems;
    if (roleBasedMenuItems[tierKey]) {
      return roleBasedMenuItems[tierKey];
    }
  }
  return roleBasedMenuItems[role as keyof typeof roleBasedMenuItems] || roleBasedMenuItems.USER;
};

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const user = useSelector(selectUser);
  const testingState = useSelector(selectTestingState);
  const { isTestingMode, selectedUser } = testingState;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Get effective user and menu items
  const effectiveUser = isTestingMode && selectedUser ? selectedUser : user;
  const currentMenuItems = getMenuItemsForRole(effectiveUser?.role || 'USER', effectiveUser?.subscription_tier);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await dispatch(logoutUser() as any);
    navigate('/login');
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: 'white' }}>
      {/* Logo Section */}
      <Toolbar sx={{ px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
              S
            </Typography>
          </Box>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: 'white' }}>
            ShareWise AI
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
      
      {/* Testing Mode Indicator */}
      {isTestingMode && selectedUser && (
        <Box sx={{ px: 2, py: 1, backgroundColor: 'primary.light', mx: 2, mt: 1, borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: 'primary.contrastText', fontWeight: 600, display: 'block' }}>
            🔍 TESTING MODE
          </Typography>
          <Typography variant="caption" sx={{ color: 'primary.contrastText', fontSize: '0.7rem' }}>
            {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.role})
          </Typography>
        </Box>
      )}
      
      {/* Navigation Menu */}
      <List sx={{ px: 2, py: 1, flex: 1, color: 'white' }}>
        {currentMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleMenuItemClick(item.path)}
              sx={{
                py: 1.5,
                px: 2,
                borderRadius: '12px',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'white' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  fontSize: '0.875rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
        <Typography variant="body2" sx={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>
          v1.0.0 - Professional Trading
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderBottom: 'none',
          boxShadow: '0px 2px 8px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: 'white'
            }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Page Title */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 600, color: 'white' }}>
              {currentMenuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              {isTestingMode && selectedUser ? (
                `Testing as ${selectedUser.role} - ${selectedUser.first_name} ${selectedUser.last_name}`
              ) : (
                new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })
              )}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <IconButton 
              size="large"
              sx={{ 
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              <Badge 
                badgeContent={4} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#EF4444',
                    color: 'white',
                    fontSize: '0.75rem'
                  }
                }}
              >
                <Notifications />
              </Badge>
            </IconButton>

            {/* Profile Menu */}
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="profile-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              sx={{
                p: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(0, 82, 204, 0.08)',
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  background: isTestingMode && selectedUser 
                    ? 'linear-gradient(135deg, #FF4757 0%, #FF6B7A 100%)' 
                    : 'linear-gradient(135deg, #0052CC 0%, #1976D2 100%)',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                {effectiveUser?.first_name?.[0] || effectiveUser?.email?.[0] || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
              borderRight: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
              borderRight: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;