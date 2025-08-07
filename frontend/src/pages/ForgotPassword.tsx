import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { LockReset, Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = ['Identificação', 'Pergunta de Segurança', 'Nova Senha'];

  const handleCheckUsername = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/auth/check-security-question/${username}`);
      setSecurityQuestion(response.data.security_question);
      setActiveStep(1);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Usuário não encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await axios.post('/api/auth/reset-password', {
        username,
        security_answer: securityAnswer,
        new_password: newPassword,
      });
      
      toast.success('Senha alterada com sucesso!');
      navigate('/login');
    } catch (error: any) {
      if (error.response?.data?.detail?.includes('security answer')) {
        setError('Resposta de segurança incorreta');
        setActiveStep(1);
      } else {
        setError(error.response?.data?.detail || 'Erro ao resetar senha');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <TextField
              fullWidth
              label="Nome de Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && username) {
                  handleCheckUsername();
                }
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleCheckUsername}
              disabled={!username || loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Verificando...' : 'Continuar'}
            </Button>
          </>
        );

      case 1:
        return (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                {securityQuestion}
              </Typography>
            </Alert>
            <TextField
              fullWidth
              label="Resposta de Segurança"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              margin="normal"
              autoFocus
              helperText="Digite exatamente como cadastrou (não diferencia maiúsculas)"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={() => setActiveStep(2)}
              disabled={!securityAnswer}
              sx={{ mt: 3 }}
            >
              Continuar
            </Button>
          </>
        );

      case 2:
        return (
          <>
            <TextField
              fullWidth
              label="Nova Senha"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              autoFocus
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Confirmar Nova Senha"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              error={confirmPassword !== '' && newPassword !== confirmPassword}
              helperText={
                confirmPassword !== '' && newPassword !== confirmPassword
                  ? 'As senhas não coincidem'
                  : ''
              }
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleResetPassword}
              disabled={!newPassword || !confirmPassword || loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Alterando senha...' : 'Alterar Senha'}
            </Button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <LockReset sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography component="h1" variant="h5">
            Recuperar Senha
          </Typography>
          
          <Box sx={{ width: '100%', mt: 3 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {renderStepContent()}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Voltar ao login
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;