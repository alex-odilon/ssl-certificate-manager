import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography,
  Divider, Avatar, Menu, MenuItem, useTheme, useMediaQuery,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Button, Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, VpnKey, Description, FolderZip,
  Folder, CheckCircle, Logout, Person, Lock, Key, Shield,
  AdminPanelSettings, DarkMode, LightMode, FolderShared
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const drawerWidth = 240;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const { lang, t, setLang } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { text: t.nav_dashboard, icon: <Dashboard />, path: '/dashboard' },
    { text: t.nav_generate_key, icon: <VpnKey />, path: '/generate-key' },
    { text: t.nav_generate_csr, icon: <Description />, path: '/generate-csr' },
    { text: t.nav_generate_pfx, icon: <FolderZip />, path: '/generate-pfx' },
    { text: t.nav_ssh_keys, icon: <Key />, path: '/generate-ssh-key' },
    { text: t.nav_app_certs, icon: <Shield />, path: '/app-certificates' },
    { text: t.nav_shared_files, icon: <FolderShared />, path: '/shared' },
    { text: t.nav_files, icon: <Folder />, path: '/files' },
    { text: t.nav_validation, icon: <CheckCircle />, path: '/validation' },
    ...(isAdmin ? [{ text: t.nav_users, icon: <AdminPanelSettings />, path: '/user-management' }] : []),
  ];

  const handleLogout = () => { signOut(); navigate('/login'); };

  const handleOpenChangePwd = () => {
    setChangePwdOpen(true);
    setAnchorEl(null);
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
  };

  const handleChangePwd = async () => {
    if (newPwd !== confirmPwd) { toast.error(t.pwd_mismatch_err); return; }
    if (newPwd.length < 8) { toast.error(t.pwd_min_err); return; }
    try {
      setChangePwdLoading(true);
      await axios.post('/api/auth/change-password', {
        current_password: currentPwd, new_password: newPwd,
      });
      toast.success(t.pwd_changed);
      setChangePwdOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.pwd_change_err);
    } finally {
      setChangePwdLoading(false);
    }
  };

  const currentFlag = LANGUAGES.find(l => l.code === lang)?.flag ?? '🌐';

  const drawer = (
    <div>
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SSL Manager
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(128,128,128,0.12)' }} />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                '&.Mui-selected::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0, width: 4,
                  backgroundColor: theme.palette.primary.main,
                  boxShadow: `0 0 10px ${theme.palette.primary.main}`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 600 : 400, fontSize: 14 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` } }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            {t.app_title}
          </Typography>

          {/* Language selector */}
          <Tooltip title="Idioma / Language">
            <IconButton onClick={e => setLangAnchor(e.currentTarget)} sx={{ fontSize: 20, color: 'text.primary' }}>
              {currentFlag}
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={langAnchor}
            open={Boolean(langAnchor)}
            onClose={() => setLangAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {LANGUAGES.map(l => (
              <MenuItem
                key={l.code}
                selected={lang === l.code}
                onClick={() => { setLang(l.code); setLangAnchor(null); }}
              >
                <span style={{ marginRight: 8 }}>{l.flag}</span> {l.label}
              </MenuItem>
            ))}
          </Menu>

          {/* Theme toggle */}
          <Tooltip title={mode === 'dark' ? t.theme_light : t.theme_dark}>
            <IconButton onClick={toggleTheme} sx={{ ml: 0.5, color: 'text.primary' }}>
              {mode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          {/* User menu */}
          <IconButton
            onClick={e => setAnchorEl(e.currentTarget)}
            size="small"
            sx={{ ml: 1 }}
          >
            <Avatar
              sx={{
                width: 32, height: 32,
                bgcolor: theme.palette.secondary.main,
                boxShadow: `0 0 10px ${theme.palette.secondary.main}`,
              }}
            >
              {user?.username.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            onClick={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
              },
            }}
          >
            <MenuItem disableRipple>
              <ListItemIcon><Person fontSize="small" /></ListItemIcon>
              {user?.username}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleOpenChangePwd}>
              <ListItemIcon><Lock fontSize="small" /></ListItemIcon>
              {t.change_password}
            </MenuItem>
            {isAdmin && (
              <MenuItem onClick={() => navigate('/user-management')}>
                <ListItemIcon><AdminPanelSettings fontSize="small" /></ListItemIcon>
                {t.nav_users}
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              {t.logout}
            </MenuItem>
          </Menu>

          {/* Change Password Dialog */}
          <Dialog open={changePwdOpen} onClose={() => setChangePwdOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>{t.change_password}</DialogTitle>
            <DialogContent>
              <TextField label={t.pwd_current} type="password" fullWidth margin="normal" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
              <TextField label={t.pwd_new} type="password" fullWidth margin="normal" value={newPwd} onChange={e => setNewPwd(e.target.value)} helperText={t.pwd_min_chars} />
              <TextField label={t.pwd_confirm} type="password" fullWidth margin="normal" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setChangePwdOpen(false)} disabled={changePwdLoading}>{t.cancel}</Button>
              <Button onClick={handleChangePwd} variant="contained" disabled={changePwdLoading || !currentPwd || !newPwd || !confirmPwd}>
                {changePwdLoading ? t.pwd_saving : t.save}
              </Button>
            </DialogActions>
          </Dialog>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          overflowX: 'hidden',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
