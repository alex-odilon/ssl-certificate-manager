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
  AdminPanelSettings, Person, Refresh,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface UserRecord {
  id: number;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
  force_password_change: boolean;
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
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [creating, setCreating] = useState(false);

  // Reset password dialog
  const [resetTarget, setResetTarget] = useState<UserRecord | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetting, setResetting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (user: UserRecord) => {
    try {
      await axios.put(`/api/admin/users/${user.id}`, { is_active: !user.is_active });
      toast.success(`Usuário ${user.is_active ? 'bloqueado' : 'desbloqueado'} com sucesso.`);
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao atualizar usuário');
    }
  };

  const handleCreate = async () => {
    if (!newEmail || !newUsername || !newPassword) {
      toast.error('Preencha todos os campos.'); return;
    }
    if (newPassword.length < 8) {
      toast.error('Senha deve ter pelo menos 8 caracteres.'); return;
    }
    try {
      setCreating(true);
      await axios.post('/api/admin/users', {
        email: newEmail, username: newUsername, password: newPassword, role: newRole,
      });
      toast.success('Usuário criado com sucesso!');
      setCreateOpen(false);
      setNewEmail(''); setNewUsername(''); setNewPassword(''); setNewRole('user');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao criar usuário');
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !resetPwd) return;
    if (resetPwd.length < 8) { toast.error('Senha deve ter pelo menos 8 caracteres.'); return; }
    try {
      setResetting(true);
      await axios.post(`/api/admin/users/${resetTarget.id}/reset-password`, {
        new_password: resetPwd, force_change: true,
      });
      toast.success('Senha redefinida. O usuário deverá trocar no próximo login.');
      setResetTarget(null);
      setResetPwd('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao redefinir senha');
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await axios.delete(`/api/admin/users/${deleteTarget.id}`);
      toast.success('Usuário e todos os seus dados foram removidos.');
      setDeleteTarget(null);
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao excluir usuário');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">Gerenciar Usuários</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar"><IconButton onClick={loadAll}><Refresh /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setCreateOpen(true)}>
            Criar Usuário
          </Button>
        </Stack>
      </Box>

      {/* Stats cards */}
      {stats && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Total de Usuários', value: stats.total_users, color: '#2196f3' },
            { label: 'Usuários Ativos', value: stats.active_users, color: '#4caf50' },
            { label: 'Usuários Bloqueados', value: stats.inactive_users, color: '#f44336' },
            { label: 'Arquivos SSL/TLS', value: stats.total_files, color: '#9c27b0' },
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
                <TableCell>Usuário</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Perfil</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Último Login</TableCell>
                <TableCell>Criado em</TableCell>
                <TableCell align="right">Ações</TableCell>
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
                      <Typography variant="body2" fontWeight="medium">{u.username}</Typography>
                      {u.force_password_change && (
                        <Chip label="Deve trocar senha" size="small" color="warning" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{u.email}</Typography></TableCell>
                  <TableCell>
                    <Chip
                      label={u.role === 'admin' ? 'Administrador' : 'Usuário'}
                      size="small"
                      color={u.role === 'admin' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.is_active ? 'Ativo' : 'Bloqueado'}
                      size="small"
                      color={u.is_active ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {u.last_login ? new Date(u.last_login).toLocaleString('pt-BR') : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title={u.is_active ? 'Bloquear acesso' : 'Desbloquear acesso'}>
                        <IconButton size="small" onClick={() => toggleActive(u)} color={u.is_active ? 'warning' : 'success'}>
                          {u.is_active ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Redefinir senha">
                        <IconButton size="small" onClick={() => setResetTarget(u)}>
                          <LockReset fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir usuário e dados">
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

      {/* ── Create User Dialog ────────────────────────────────────────────── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            O usuário receberá a senha temporária definida aqui e será obrigado a trocá-la no primeiro acesso.
          </Alert>
          <TextField fullWidth label="Nome de usuário" value={newUsername} onChange={e => setNewUsername(e.target.value)} margin="normal" />
          <TextField fullWidth label="E-mail" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} margin="normal" />
          <TextField fullWidth label="Senha temporária" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} margin="normal" helperText="Mínimo 8 caracteres" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Perfil</InputLabel>
            <Select value={newRole} onChange={e => setNewRole(e.target.value)} label="Perfil">
              <MenuItem value="user">Usuário</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={creating}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating}>
            {creating ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reset Password Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!resetTarget} onClose={() => setResetTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Redefinir Senha — {resetTarget?.username}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            O usuário será obrigado a trocar a senha no próximo login.
          </Alert>
          <TextField fullWidth label="Nova senha temporária" type="password" value={resetPwd}
            onChange={e => setResetPwd(e.target.value)} margin="normal" helperText="Mínimo 8 caracteres" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetTarget(null)} disabled={resetting}>Cancelar</Button>
          <Button onClick={handleResetPassword} variant="contained" color="warning" disabled={resetting}>
            {resetting ? 'Redefinindo...' : 'Redefinir Senha'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Excluir Usuário</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Esta ação é irreversível. Todos os arquivos SSL/TLS e chaves SSH do usuário serão removidos permanentemente.
          </Alert>
          <Typography>Confirma a exclusão de <strong>{deleteTarget?.username}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? 'Removendo...' : 'Excluir Permanentemente'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
