import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppThemeProvider, useThemeMode } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import ForcePasswordChange from './components/ForcePasswordChange';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GenerateKey from './pages/GenerateKey';
import GenerateCSR from './pages/GenerateCSR';
import GeneratePFX from './pages/GeneratePFX';
import GenerateSSHKey from './pages/GenerateSSHKey';
import Files from './pages/Files';
import Validation from './pages/Validation';
import UserManagement from './pages/UserManagement';
import AppCertificates from './pages/AppCertificates';

// ForcePasswordChange wrapper — needs AuthContext
const ForcePasswordChangeGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  if (user?.force_password_change) {
    return (
      <>
        <ForcePasswordChange
          open
          username={user.username}
          onSuccess={refreshUser}
        />
        {/* Render children blurred behind dialog so layout is visible */}
        <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }}>{children}</div>
      </>
    );
  }
  return <>{children}</>;
};

// Toast theme follows dark/light mode
const ThemedToast: React.FC = () => {
  const { mode } = useThemeMode();
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={mode}
    />
  );
};

function App() {
  return (
    <AppThemeProvider>
      <CssBaseline />
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <ForcePasswordChangeGate>
                      <Layout />
                    </ForcePasswordChangeGate>
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="generate-key" element={<GenerateKey />} />
                <Route path="generate-csr" element={<GenerateCSR />} />
                <Route path="generate-pfx" element={<GeneratePFX />} />
                <Route path="generate-ssh-key" element={<GenerateSSHKey />} />
                <Route path="app-certificates" element={<AppCertificates />} />
                <Route path="files" element={<Files />} />
                <Route path="validation" element={<Validation />} />
                <Route path="user-management" element={<UserManagement />} />
              </Route>
            </Routes>
          </Router>
          <ThemedToast />
        </AuthProvider>
      </LanguageProvider>
    </AppThemeProvider>
  );
}

export default App;
