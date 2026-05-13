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
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  open: boolean;
  username: string;
  onSuccess: () => void;
}

function strengthScore(p: string): { score: number; color: 'error' | 'warning' | 'info' | 'success' } {
  if (!p) return { score: 0, color: 'error' };
  let s = 0;
  if (p.length >= 8)  s += 20;
  if (p.length >= 12) s += 15;
  if (p.length >= 16) s += 15;
  if (/[a-z]/.test(p)) s += 10;
  if (/[A-Z]/.test(p)) s += 10;
  if (/[0-9]/.test(p)) s += 10;
  if (/[^a-zA-Z0-9]/.test(p)) s += 20;
  s = Math.min(s, 100);
  if (s < 30) return { score: s, color: 'error' };
  if (s < 55) return { score: s, color: 'warning' };
  if (s < 80) return { score: s, color: 'info' };
  return { score: s, color: 'success' };
}

const ForcePasswordChange: React.FC<Props> = ({ open, username, onSuccess }) => {
  const { t } = useLanguage();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const str = strengthScore(next);

  const strengthLabel = () => {
    if (str.score < 30) return t.fp_weak;
    if (str.score < 55) return t.fp_fair;
    if (str.score < 80) return t.fp_good;
    return t.fp_strong;
  };

  const mismatch = !!confirm && next !== confirm;

  const securityTips = [
    t.fp_tip1, t.fp_tip2, t.fp_tip3, t.fp_tip4, t.fp_tip5, t.fp_tip6,
  ];

  const handleSubmit = async () => {
    if (!current || !next || !confirm) { toast.error(t.fp_fill_all); return; }
    if (next !== confirm) { toast.error(t.fp_mismatch_err); return; }
    if (next.length < 8) { toast.error(t.fp_min_8); return; }
    if (str.score < 30) { toast.error(t.fp_too_weak); return; }
    try {
      setLoading(true);
      await axios.post('/api/auth/change-password', {
        current_password: current,
        new_password: next,
      });
      toast.success(t.fp_success);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.fp_err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AdminPanelSettings color="warning" />
        {t.fp_title}
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>{t.fp_first_access} — {username}</AlertTitle>
          {t.fp_first_access_desc}
        </Alert>

        <Alert severity="info" icon={<Security />} sx={{ mb: 3 }}>
          <AlertTitle>{t.fp_security_title}</AlertTitle>
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
          label={t.fp_current_pwd}
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
          label={t.fp_new_pwd}
          type={show ? 'text' : 'password'}
          value={next}
          onChange={e => setNext(e.target.value)}
          margin="normal"
        />

        {next && (
          <Box sx={{ mb: 1 }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">{t.fp_strength}</Typography>
              <Typography variant="caption" color={`${str.color}.main`} fontWeight={600}>{strengthLabel()}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={str.score} color={str.color} sx={{ borderRadius: 1, height: 6 }} />
          </Box>
        )}

        <TextField
          fullWidth
          label={t.fp_confirm_pwd}
          type={show ? 'text' : 'password'}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          margin="normal"
          error={mismatch}
          helperText={mismatch ? t.fp_mismatch : ''}
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
          {loading ? t.fp_changing : t.fp_set_btn}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ForcePasswordChange;
