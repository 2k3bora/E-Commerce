import React, { useState, useEffect, useContext } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Button
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircle from '@mui/icons-material/AccountCircle';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', allowedRoles: ['admin', 'distributor', 'branch', 'customer'] },
  { text: 'Products', icon: <ShoppingCartIcon />, path: '/products', allowedRoles: ['admin', 'distributor'] },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers', allowedRoles: ['admin', 'distributor'] },
  { text: 'Wallet', icon: <AccountBalanceWalletIcon />, path: '/wallet', allowedRoles: ['admin', 'branch', 'customer'] },
  { text: 'Commission Settings', icon: <SettingsIcon />, path: '/admin/commissions', allowedRoles: ['admin'] },
  { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings', allowedRoles: ['admin'] },
];

export default function Navigation({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useContext(AuthContext);
  const [appConfig, setAppConfig] = useState({ siteName: 'E-commerce', siteIconUrl: '' });

  useEffect(() => {
    let mounted = true;
    axios.get('/api/app/config').then(res => { if (mounted) setAppConfig({ siteName: res.data.siteName || 'E-commerce', siteIconUrl: res.data.siteIconUrl || '' }); }).catch(() => { });
    return () => mounted = false;
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          E-commerce
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => {
          // show menu item only if user has one of the allowed roles
          if (item.allowedRoles && user) {
            const role = (user.role || '').toString().toLowerCase();
            const allowed = item.allowedRoles.map(r => r.toString().toLowerCase());
            if (!allowed.includes(role)) return null;
          }
          // if no user (not logged in) show only Dashboard and Login
          if (!user && item.text !== 'Dashboard') return null;

          let itemPath = item.path;
          if (item.text === 'Dashboard' && user) {
            const r = (user.role || '').toLowerCase();
            if (r === 'admin') itemPath = '/admin/dashboard';
            else if (r === 'distributor') itemPath = '/distributor';
            else if (r === 'branch') itemPath = '/branch';
            else if (r === 'customer') itemPath = '/catalog';
          }

          return (
            <ListItem
              button
              key={item.text}
              component={RouterLink}
              to={itemPath}
              onClick={() => { if (isMobile) setMobileOpen(false); }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {appConfig.siteIconUrl ? <img src={appConfig.siteIconUrl} alt="icon" style={{ width: 32, height: 32, marginRight: 12, borderRadius: 4 }} /> : null}
            <Typography variant="h6" noWrap component="div">
              {appConfig.siteName || 'Dashboard'}
            </Typography>
          </Box>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>{user.name || user.email}</Typography>
              <IconButton color="inherit" onClick={() => logout()}>
                <AccountCircle />
              </IconButton>
            </div>
          ) : (
            <Button color="inherit" component={RouterLink} to="/login">Login</Button>
          )}
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar /> {/* This adds space below the AppBar */}
        {children}
      </Box>
    </Box>
  );
}