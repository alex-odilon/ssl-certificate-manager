import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Alert, Stack, CircularProgress,
  Card, CardContent, Grid,
} from '@mui/material';
import {
  PersonAdd, Block, CheckCircle, Delete, LockReset,
  AdminPanelSettings, Person, Refresh, LockOpen,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLanguage } from '../contexts/LanguageContext';

interface UserRecord {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  force_password_change: boolean;
  failed_login_attempts: number;
  login_locked: boolean;
  last_login: string | null;
  created_at: string;
}

interface Stats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_files: number;
  total_ssh_keys: number;
}

const UserManagement: React.FC = () => {
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [creating, setCreating] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const [resetTarget, setResetTarget] = useState<UserRecord | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetting, setResetting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [unlockTarget, setUnlockTarget] = useState<UserRecord | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/stats'),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch {
      toast.error(t.um_err_load);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (user: UserRecord) => {
    try {
      await axios.put(`/api/admin/users/${user.id}`, { is_active: !user.is_active });
      toast.success(`${t.um_col_user} ${user.username} ${user.is_active ? t.um_blocked_success : t.um_unblocked_success}.`);
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.um_err_update);
    }
  };

  const handleCreate = async () => {
    if (!newEmail || !newUsername) { toast.error(t.um_fill_all); return; }
    try {
      setCreating(true);
      const res = await axios.post('/api/admin/users', {
        email: newEmail, username: newUsername, full_name: newFullName || null, role: newRole,
      });
      toast.success(t.um_created_title);
      setGeneratedPassword(res.data.generated_password);
      setNewFullName(''); setNewEmail(''); setNewUsername(''); setNewRole('user');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.um_err_create);
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !resetPwd) return;
    if (resetPwd.length < 8) { toast.error(t.um_pwd_min_8); return; }
    try {
      setResetting(true);
      await axios.post(`/api/admin/users/${resetTarget.id}/reset-password`, {
        new_password: resetPwd, force_change: true,
      });
      toast.success(t.um_reset_success);
      setResetTarget(null);
      setResetPwd('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.um_err_reset);
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await axios.delete(`/api/admin/users/${deleteTarget.id}`);
      toast.success(t.um_delete_success);
      setDeleteTarget(null);
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.um_err_delete);
    } finally {
      setDeleting(false);
    }
  };

  const handleUnlock = async (user: UserRecord) => {
    try {
      setUnlocking(true);
      const res = await axios.post(`/api/admin/users/${user.id}/unlock`);
      setUnlockTarget(user);
      setUnlockPassword(res.data.generated_password);
      toast.success(t.um_unlock_success);
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.um_err_unlock);
    } finally {
      setUnlocking(false);
    }
  };

  const localeStr = lang === 'pt-BR' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">{t.users_title}</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title={t.um_refresh}><IconButton onClick={loadAll}><Refresh /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setCreateOpen(true)}>
            {t.users_create}
          </Button>
        </Stack>
      </Box>

      {stats && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: t.um_stat_total, value: stats.total_users, color: '#2196f3' },
            { label: t.um_stat_active, value: stats.active_users, color: '#4caf50' },
            { label: t.um_stat_blocked, value: stats.inactive_users, color: '#f44336' },
            { label: t.um_stat_ssl, value: stats.total_files, color: '#9c27b0' },
          ].map(c => (
            <Grid item xs={12} sm={6} md={3} key={c.label}>
              <Card sx={{ borderTop: `4px solid ${c.color}` }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography color="text.secondary" variant="body2">{c.label}</Typography>
                  <Typography variant="h4">{c.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t.um_col_user}</TableCell>
                <TableCell>{t.um_col_email}</TableCell>
                <TableCell>{t.um_col_profile}</TableCell>
                <TableCell>{t.status}</TableCell>
                <TableCell>{t.um_col_last_login}</TableCell>
                <TableCell>{t.um_col_created}</TableCell>
                <TableCell align="right">{t.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {u.role === 'admin'
                        ? <AdminPanelSettings fontSize="small" color="warning" />
                        : <Person fontSize="small" color="action" />}
                      <Box>
                        <Typography variant="body2" fontWeight="medium">{u.username}</Typography>
                        {u.full_name && (
                          <Typography variant="caption" color="text.secondary">{u.full_name}</Typography>
                        )}
                      </Box>
                      {u.force_password_change && (
                        <Chip label={t.um_must_change_pwd} size="small" color="warning" />
                      )}
                      {u.login_locked && (
                        <Chip label={t.um_login_locked_chip} size="small" color="error" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{u.email}</Typography></TableCell>
                  <TableCell>
                    <Chip
                      label={u.role === 'admin' ? t.users_admin : t.users_user}
                      size="small"
                      color={u.role === 'admin' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.is_active ? t.users_active : t.um_blocked_chip}
                      size="small"
                      color={u.is_active ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {u.last_login ? new Date(u.last_login).toLocaleString(localeStr) : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(u.created_at).toLocaleDateString(localeStr)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {u.login_locked && (
                        <Tooltip title={t.um_unlock_tip}>
                          <span>
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleUnlock(u)}
                              disabled={unlocking}
                            >
                              <LockOpen fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      <Tooltip title={u.is_active ? t.um_block_access : t.um_unblock_access}>
                        <IconButton size="small" onClick={() => toggleActive(u)} color={u.is_active ? 'warning' : 'success'}>
                          {u.is_active ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.um_reset_tip}>
                        <IconButton size="small" onClick={() => setResetTarget(u)}>
                          <LockReset fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.um_delete_tip}>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(u)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t.um_create_title}</DialogTitle>
        <DialogContent>
          {!generatedPassword ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>{t.um_auto_pwd_info}</Alert>
              <TextField fullWidth label={t.um_fullname_field} value={newFullName} onChange={e => setNewFullName(e.target.value)} margin="normal" />
              <TextField fullWidth label={t.um_username_field} value={newUsername} onChange={e => setNewUsername(e.target.value)} margin="normal" required />
              <TextField fullWidth label={t.um_email_field} type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} margin="normal" required />
              <FormControl fullWidth margin="normal">
                <InputLabel>{t.um_role_field}</InputLabel>
                <Select value={newRole} onChange={e => setNewRole(e.target.value)} label={t.um_role_field}>
                  <MenuItem value="user">{t.um_role_user}</MenuItem>
                  <MenuItem value="admin">{t.um_role_admin}</MenuItem>
                </Select>
              </FormControl>
            </>
          ) : (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">{t.um_created_title}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>{t.um_temp_pwd_send}</Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="h5" component="code">{generatedPassword}</Typography>
              </Box>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          {!generatedPassword ? (
            <>
              <Button onClick={() => setCreateOpen(false)} disabled={creating}>{t.cancel}</Button>
              <Button onClick={handleCreate} variant="contained" disabled={creating}>
                {creating ? t.um_creating : t.users_create}
              </Button>
            </>
          ) : (
            <Button onClick={() => { setCreateOpen(false); setGeneratedPassword(''); }} variant="contained">
              {t.um_done}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetTarget} onClose={() => setResetTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t.um_reset_dialog_title} — {resetTarget?.username}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>{t.um_reset_force_info}</Alert>
          <TextField fullWidth label={t.um_new_temp_pwd} type="password" value={resetPwd}
            onChange={e => setResetPwd(e.target.value)} margin="normal" helperText={t.um_min_8_helper} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetTarget(null)} disabled={resetting}>{t.cancel}</Button>
          <Button onClick={handleResetPassword} variant="contained" color="warning" disabled={resetting}>
            {resetting ? t.um_resetting : t.um_reset_btn}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t.um_delete_dialog_title}</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>{t.um_delete_warning}</Alert>
          <Typography>{t.um_delete_confirm_msg} <strong>{deleteTarget?.username}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>{t.cancel}</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? t.um_deleting : t.um_delete_permanent}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unlock Account Dialog — shows generated password after unlock */}
      <Dialog open={!!unlockTarget && !!unlockPassword} onClose={() => { setUnlockTarget(null); setUnlockPassword(''); }} maxWidth="xs" fullWidth>
        <DialogTitle>{t.um_unlock_dialog_title} — {unlockTarget?.username}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>{t.um_unlock_info}</Alert>
          <Box sx={{ mt: 1, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="h5" component="code">{unlockPassword}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUnlockTarget(null); setUnlockPassword(''); }} variant="contained">
            {t.um_done}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
