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
  ShowChart,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import { selectTestingState } from '../../store/slices/testingSlice';
import Footer from './Footer';

const drawerWidth = 240;

const roleBasedMenuItems = {
  SUPER_ADMIN: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Trading', icon: <TrendingUp />, path: '/trading' },
    { text: 'User Management', icon: <People />, path: '/users' },
    { text: 'System Analytics', icon: <BarChart />, path: '/analytics' },
    { text: 'Trading Monitor', icon: <ShowChart />, path: '/trading-monitor' },
    { text: 'Support Center', icon: <Support />, path: '/support-center' },
    { text: 'System Settings', icon: <AdminPanelSettings />, path: '/system-settings' },
  ],
  USER_BASIC: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Trading', icon: <TrendingUp />, path: '/trading' },
    { text: 'Quick Trade', icon: <Psychology />, path: '/trading?mode=quick' },
    { text: 'Portfolio', icon: <AccountBalance />, path: '/portfolio' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ],
  USER_PRO: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Trading', icon: <TrendingUp />, path: '/trading' },
    { text: 'Quick Trade', icon: <Psychology />, path: '/trading?mode=quick' },
    { text: 'Portfolio', icon: <AccountBalance />, path: '/portfolio' },
    { text: 'Strategies', icon: <Psychology />, path: '/strategies' },
    { text: 'AI Studio', icon: <ModelTraining />, path: '/ai-studio' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ],
  USER_ELITE: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Trading', icon: <TrendingUp />, path: '/trading' },
    { text: 'Advanced Trading', icon: <TrendingUp />, path: '/advanced-trading' },
    { text: 'Quick Trade', icon: <Psychology />, path: '/trading?mode=quick' },
    { text: 'Portfolio', icon: <AccountBalance />, path: '/portfolio' },
    { text: 'Strategies', icon: <Psychology />, path: '/strategies' },
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
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

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

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
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
                py: 1,
                px: 1,
                borderRadius: '12px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40, 
                color: '#FFFFFF',
                opacity: 1,
                transition: 'color 0.2s ease-in-out',
                '& .MuiSvgIcon-root': {
                  color: '#FFFFFF',
                  opacity: 1
                }
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}
                sx={{
                  '& .MuiListItemText-primary': {
                    transition: 'all 0.2s ease-in-out'
                  }
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
          backgroundColor: 'white',
          color: 'primary.main',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
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
              color: 'primary.main'
            }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Page Title */}
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {location.pathname.startsWith('/dashboard')
                  ? 'Main page'
                  : (currentMenuItems.find(item => item.path === location.pathname)?.text || 'Main page')}
              </Typography>
              {/* {effectiveUser?.role === 'SUPER_ADMIN' && (
                <Box
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.2,
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: 'primary.light',
                    color: 'primary.main',
                    backgroundColor: 'white'
                  }}
                >
                </Box>
              )} */}
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
              onClick={handleNotificationMenuOpen}
              sx={{ 
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.12)'
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
                  backgroundColor: 'rgba(102, 126, 234, 0.08)',
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

      {/* Notifications Menu */}
      <Menu
        id="notification-menu"
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationMenuClose}
        onClick={handleNotificationMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 320,
            maxHeight: 400,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F2937' }}>
            Notifications
          </Typography>
        </Box>
        
        {/* Sample notifications for Super Admin */}
        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemIcon>
            <Badge color="success" variant="dot">
              <AccountCircle fontSize="small" />
            </Badge>
          </ListItemIcon>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              New user registered
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              John Doe joined the platform • 2 min ago
            </Typography>
          </Box>
        </MenuItem>

        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemIcon>
            <Badge color="warning" variant="dot">
              <AdminPanelSettings fontSize="small" />
            </Badge>
          </ListItemIcon>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              System maintenance scheduled
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Planned downtime at 2:00 AM UTC • 1 hour ago
            </Typography>
          </Box>
        </MenuItem>

        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemIcon>
            <Badge color="primary" variant="dot">
              <Support fontSize="small" />
            </Badge>
          </ListItemIcon>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Support ticket resolved
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Ticket #1234 closed successfully • 3 hours ago
            </Typography>
          </Box>
        </MenuItem>

        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemIcon>
            <Badge color="error" variant="dot">
              <Notifications fontSize="small" />
            </Badge>
          </ListItemIcon>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              API rate limit warning
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              High API usage detected • 5 hours ago
            </Typography>
          </Box>
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
          pb: 8, // Add padding bottom for footer
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Outlet />
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;