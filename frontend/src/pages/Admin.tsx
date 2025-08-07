import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Edit,
  Delete,
  Block,
  CheckCircle,
  VpnKey,
  PersonAdd,
  AdminPanelSettings,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await axios.put(`/api/admin/users/${user.id}`, {
        is_active: !user.is_active,
      });
      toast.success(
        user.is_active ? 'Usuário bloqueado' : 'Usuário desbloqueado'
      );
      loadUsers();
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleChangeRole = async (user: User, newRole: string) => {
    try {
      await axios.put(`/api/admin/users/${user.id}`, {
        role: newRole,
      });
      toast.success('Permissão alterada com sucesso');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao alterar permissão');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    try {
      await axios.post(`/api/admin/users/${selectedUser.id}/reset-password`, null, {
        params: { new_password: newPassword },
      });
      toast.success('Senha resetada com sucesso');
      setResetPasswordDialog(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      toast.error('Erro ao resetar senha');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${user.username}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/users/${user.id}`);
      toast.success('Usuário excluído com sucesso');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao excluir usuário');
    }
  };

  const handleCreateUser = async () => {
    try {
      await axios.post('/api/admin/users', newUser);
      toast.success('Usuário criado com sucesso');
      setCreateUserDialog(false);
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao criar usuário');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <AdminPanelSettings sx={{ verticalAlign: 'middle', mr: 1 }} />
          Painel Administrativo
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setCreateUserDialog(true)}
        >
          Novo Usuário
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Como administrador, você pode gerenciar usuários, resetar senhas e controlar acessos. 
        Lembre-se: com grandes poderes vêm grandes responsabilidades!
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuário</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="center">Tipo</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Criado em</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {user.username}
                  </Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell align="center">
                  <FormControl size="small" variant="standard">
                    <Select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user, e.target.value)}
                      disabled={user.username === 'admin'}
                    >
                      <MenuItem value="user">Usuário</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    icon={user.is_active ? <CheckCircle /> : <Block />}
                    label={user.is_active ? 'Ativo' : 'Bloqueado'}
                    color={user.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Resetar senha">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedUser(user);
                        setResetPasswordDialog(true);
                      }}
                    >
                      <VpnKey />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={user.is_active ? 'Bloquear' : 'Desbloquear'}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleActive(user)}
                      disabled={user.username === 'admin'}
                    >
                      {user.is_active ? <Block /> : <CheckCircle />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user)}
                      disabled={user.username === 'admin'}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)}>
        <DialogTitle>Resetar Senha</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Resetar senha do usuário: <strong>{selectedUser?.username}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Nova Senha"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setResetPasswordDialog(false);
            setNewPassword('');
          }}>
            Cancelar
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={!newPassword}
          >
            Resetar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createUserDialog} onClose={() => setCreateUserDialog(false)}>
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome de Usuário"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Senha"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de Usuário</InputLabel>
            <Select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              label="Tipo de Usuário"
            >
              <MenuItem value="user">Usuário</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateUserDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            disabled={!newUser.username || !newUser.email || !newUser.password}
          >
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Admin;