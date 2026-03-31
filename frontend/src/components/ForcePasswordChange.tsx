import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, Alert, AlertTitle,
  LinearProgress, Box, List, ListItem, ListItemIcon, ListItemText,
  InputAdornment, IconButton,
} from '@mui/material';
import {
  Lock, Visibility, VisibilityOff, CheckCircle, Warning,
  Security, AdminPanelSettings,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Props {
  open: boolean;
  username: string;
  onSuccess: () => void;
}

function strength(p: string): { score: number; label: string; color: 'error'|'warning'|'info'|'success' } {
  if (!p) return { score: 0, label: '', color: 'error' };
  let s = 0;
  if (p.length >= 8)  s += 20;
  if (p.length >= 12) s += 15;
  if (p.length >= 16) s += 15;
  if (/[a-z]/.test(p)) s += 10;
  if (/[A-Z]/.test(p)) s += 10;
  if (/[0-9]/.test(p)) s += 10;
  if (/[^a-zA-Z0-9]/.test(p)) s += 20;
  s = Math.min(s, 100);
  if (s < 30) return { score: s, label: 'Fraca', color: 'error' };
  if (s < 55) return { score: s, label: 'Razoável', color: 'warning' };
  if (s < 80) return { score: s, label: 'Boa', color: 'info' };
  return { score: s, label: 'Forte', color: 'success' };
}

const securityTips = [
  'Use no mínimo 12 caracteres com letras, números e símbolos.',
  'Não reutilize senhas de outros sistemas ou serviços.',
  'Armazene a senha em um gerenciador de senhas corporativo.',
  'Nunca compartilhe as credenciais de administrador.',
  'Esta conta tem acesso a todos os certificados e usuários do sistema.',
  'Em caso de suspeita de comprometimento, altere a senha imediatamente e notifique a equipe de segurança.',
];

const ForcePasswordChange: React.FC<Props> = ({ open, username, onSuccess }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const str = strength(next);
  const mismatch = !!confirm && next !== confirm;

  const handleSubmit = async () => {
    if (!current || !next || !confirm) { toast.error('Preencha todos os campos.'); return; }
    if (next !== confirm) { toast.error('As senhas não coincidem.'); return; }
    if (next.length < 8)  { toast.error('A senha deve ter pelo menos 8 caracteres.'); return; }
    if (str.score < 30)   { toast.error('Escolha uma senha mais forte.'); return; }
    try {
      setLoading(true);
      await axios.post('/api/auth/change-password', {
        current_password: current,
        new_password: next,
      });
      toast.success('Senha alterada com sucesso! Bem-vindo ao SSL Manager.');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AdminPanelSettings color="warning" />
        Alteração de Senha Obrigatória
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Primeiro acesso detectado — {username}</AlertTitle>
          Por segurança, você deve definir uma nova senha antes de continuar.
          A senha padrão <strong>admin</strong> é conhecida e representa um risco crítico.
        </Alert>

        {/* Security tips */}
        <Alert severity="info" icon={<Security />} sx={{ mb: 3 }}>
          <AlertTitle>Recomendações de Segurança para Conta Master</AlertTitle>
          <List dense disablePadding>
            {securityTips.map((tip, i) => (
              <ListItem key={i} disablePadding sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Warning fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={tip} />
              </ListItem>
            ))}
          </List>
        </Alert>

        <TextField
          fullWidth
          label="Senha Atual"
          type={show ? 'text' : 'password'}
          value={current}
          onChange={e => setCurrent(e.target.value)}
          margin="normal"
          InputProps={{
            startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShow(!show)} edge="end">
                  {show ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Nova Senha"
          type={show ? 'text' : 'password'}
          value={next}
          onChange={e => setNext(e.target.value)}
          margin="normal"
        />

        {next && (
          <Box sx={{ mb: 1 }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">Força da senha</Typography>
              <Typography variant="caption" color={`${str.color}.main`} fontWeight={600}>{str.label}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={str.score} color={str.color} sx={{ borderRadius: 1, height: 6 }} />
          </Box>
        )}

        <TextField
          fullWidth
          label="Confirmar Nova Senha"
          type={show ? 'text' : 'password'}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          margin="normal"
          error={mismatch}
          helperText={mismatch ? 'As senhas não coincidem.' : ''}
          InputProps={{
            endAdornment: !mismatch && confirm ? (
              <InputAdornment position="end"><CheckCircle color="success" /></InputAdornment>
            ) : undefined,
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          color="warning"
          onClick={handleSubmit}
          disabled={loading || !current || !next || !confirm || mismatch}
          fullWidth
          size="large"
        >
          {loading ? 'Alterando...' : 'Definir Nova Senha e Continuar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ForcePasswordChange;
