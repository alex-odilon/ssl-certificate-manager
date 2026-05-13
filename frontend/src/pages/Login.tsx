import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, TextField, Button, Typography, Box, Alert,
  IconButton, InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginFormData {
  username: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      await signIn(data.username, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(t.login_error);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper
          elevation={3}
          sx={{
            padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%',
            background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
          }}
        >
          <Lock sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography component="h1" variant="h5">SSL Certificate Manager</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t.login_subtitle}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>
          )}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, width: '100%' }}>
            <TextField
              margin="normal" required fullWidth id="username"
              label={t.login_username} autoComplete="username" autoFocus
              {...register('username', { required: t.login_username_required })}
              error={!!errors.username} helperText={errors.username?.message}
            />
            <TextField
              margin="normal" required fullWidth
              label={t.login_password}
              type={showPassword ? 'text' : 'password'}
              id="password" autoComplete="current-password"
              {...register('password', { required: t.login_password_required })}
              error={!!errors.password} helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isSubmitting}
            >
              {isSubmitting ? t.login_signing_in : t.login_sign_in}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
