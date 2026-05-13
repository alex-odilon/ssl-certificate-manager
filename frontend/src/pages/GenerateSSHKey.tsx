import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  FormControlLabel,
  LinearProgress,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  Key,
  Info,
  Download,
  ContentCopy,
  CheckCircle,
  Warning,
  Delete,
  Visibility,
  VisibilityOff,
  Shield,
  Terminal,
  Add,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLanguage } from '../contexts/LanguageContext';

interface SSHKeyRecord {
  id: number;
  custom_name: string;
  description: string | null;
  tags: string[];
  key_type: string;
  key_size: number | null;
  comment: string;
  has_passphrase: boolean;
  public_key_content: string;
  private_key_filename: string;
  created_at: string;
}

interface FormValues {
  custom_name: string;
  description: string;
  comment: string;
}

function passphraseStrength(p: string): { score: number; color: 'error' | 'warning' | 'info' | 'success' } {
  if (!p) return { score: 0, color: 'error' };
  let score = 0;
  if (p.length >= 8)  score += 20;
  if (p.length >= 12) score += 15;
  if (p.length >= 16) score += 15;
  if (/[a-z]/.test(p)) score += 10;
  if (/[A-Z]/.test(p)) score += 10;
  if (/[0-9]/.test(p)) score += 10;
  if (/[^a-zA-Z0-9]/.test(p)) score += 20;
  score = Math.min(score, 100);
  if (score < 30) return { score, color: 'error' };
  if (score < 55) return { score, color: 'warning' };
  if (score < 80) return { score, color: 'info' };
  return { score, color: 'success' };
}

function keyLabel(kt: string, ks: number | null): string {
  if (kt === 'ED25519') return 'Ed25519';
  if (kt === 'ECDSA') return `ECDSA P-${ks}`;
  return `RSA ${ks} bits`;
}

const GenerateSSHKey: React.FC = () => {
  const { t, lang } = useLanguage();
  const localeStr = lang === 'pt-BR' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';

  const [keyType, setKeyType] = useState<'Ed25519' | 'RSA' | 'ECDSA'>('Ed25519');
  const [keySize, setKeySize] = useState<number>(4096);
  const [usePassphrase, setUsePassphrase] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<SSHKeyRecord | null>(null);
  const [keys, setKeys] = useState<SSHKeyRecord[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SSHKeyRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const strength = passphraseStrength(passphrase);

  const strengthLabel = () => {
    if (strength.score < 30) return t.fp_weak;
    if (strength.score < 55) return t.fp_fair;
    if (strength.score < 80) return t.fp_good;
    return t.fp_strong;
  };

  const RSA_SIZES = [2048, 3072, 4096];
  const ECDSA_SIZES = [{ label: 'P-256 (256 bits)', value: 256 }, { label: 'P-384 (384 bits)', value: 384 }];

  useEffect(() => {
    if (keyType === 'RSA') setKeySize(4096);
    else if (keyType === 'ECDSA') setKeySize(256);
  }, [keyType]);

  useEffect(() => { loadKeys(); }, []);

  const loadKeys = async () => {
    try {
      setListLoading(true);
      const res = await axios.get('/api/ssh/');
      setKeys(res.data);
    } catch {
      toast.error(t.ssh_err_load);
    } finally {
      setListLoading(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) { setTags([...tags, tag]); setTagInput(''); }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t.ssh_pub_copied);
    } catch {
      toast.error(t.copy);
    }
  };

  const handleDownload = async (id: number, type: 'private' | 'public', name: string) => {
    try {
      const res = await axios.get(`/api/ssh/${id}/download/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', type === 'private' ? name : `${name}.pub`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t.gk_success_dl);
    } catch {
      toast.error(t.gk_err_dl);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await axios.delete(`/api/ssh/${deleteTarget.id}`);
      toast.success(t.ssh_delete_success);
      setKeys(keys.filter(k => k.id !== deleteTarget.id));
      if (generatedKey?.id === deleteTarget.id) setGeneratedKey(null);
      setDeleteTarget(null);
    } catch {
      toast.error(t.ssh_err_delete);
    } finally {
      setDeleteLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (usePassphrase) {
      if (!passphrase) { toast.error('Passphrase required'); return; }
      if (passphrase !== confirmPassphrase) { toast.error(t.ssh_passphrase_mismatch); return; }
      if (passphrase.length < 8) { toast.error(t.fp_min_8); return; }
    }

    try {
      setLoading(true);
      const payload: any = {
        key_type: keyType,
        key_size: keySize,
        comment: data.comment.trim(),
        custom_name: data.custom_name,
        description: data.description,
        tags,
      };
      if (usePassphrase && passphrase) payload.passphrase = passphrase;

      const res = await axios.post('/api/ssh/generate', payload);
      const newKey: SSHKeyRecord = res.data;
      setGeneratedKey(newKey);
      setKeys([newKey, ...keys]);
      toast.success(t.ssh_success_title);

      reset();
      setTags([]);
      setPassphrase('');
      setConfirmPassphrase('');
      setUsePassphrase(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.ssh_err_gen);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>{t.ssh_title}</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>{t.ssh_subtitle}</Typography>

      <Paper sx={{ p: 4, mt: 2 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>

            {/* Key type */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1" fontWeight={600}>{t.ssh_key_type_label}</Typography>
                <Tooltip title={t.gk_key_type_hint}>
                  <IconButton size="small"><Info fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
              <ToggleButtonGroup
                value={keyType}
                exclusive
                onChange={(_, v) => v && setKeyType(v)}
                size="small"
                sx={{ mb: 1.5 }}
              >
                <ToggleButton value="Ed25519">Ed25519</ToggleButton>
                <ToggleButton value="RSA">RSA</ToggleButton>
                <ToggleButton value="ECDSA">ECDSA</ToggleButton>
              </ToggleButtonGroup>

              <Collapse in={keyType !== 'Ed25519'}>
                <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                  <InputLabel>{keyType === 'RSA' ? t.gk_key_size_rsa : t.gk_key_size_ec}</InputLabel>
                  <Select
                    value={keySize}
                    label={keyType === 'RSA' ? t.gk_key_size_rsa : t.gk_key_size_ec}
                    onChange={e => setKeySize(Number(e.target.value))}
                  >
                    {keyType === 'RSA'
                      ? RSA_SIZES.map(s => (
                          <MenuItem key={s} value={s}>
                            {s} bits{s === 4096 ? ` (${t.gk_high_security})` : s === 2048 ? ` (${t.gk_default})` : ''}
                          </MenuItem>
                        ))
                      : ECDSA_SIZES.map(s => (
                          <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                        ))
                    }
                  </Select>
                </FormControl>
              </Collapse>
            </Box>

            <Divider />

            {/* Comment */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1" fontWeight={600}>{t.ssh_comment_label}</Typography>
              </Box>
              <TextField
                fullWidth
                placeholder="usuario@meuservidor.com"
                {...register('comment')}
                InputProps={{
                  startAdornment: <Terminal sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />,
                }}
              />
            </Box>

            <Divider />

            {/* Passphrase */}
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Shield fontSize="small" color={usePassphrase ? 'success' : 'warning'} />
                  <Typography variant="subtitle1" fontWeight={600}>{t.ssh_passphrase_title}</Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={usePassphrase}
                      onChange={e => setUsePassphrase(e.target.checked)}
                      color="success"
                    />
                  }
                  label={usePassphrase ? t.ssh_passphrase_on : t.ssh_passphrase_off}
                  labelPlacement="start"
                />
              </Box>

              <Collapse in={!usePassphrase}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle>{t.ssh_no_passphrase_alert_title}</AlertTitle>
                  {t.ssh_no_passphrase_alert_desc}
                </Alert>
              </Collapse>

              <Collapse in={usePassphrase}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Passphrase"
                    type={showPassphrase ? 'text' : 'password'}
                    value={passphrase}
                    onChange={e => setPassphrase(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassphrase(!showPassphrase)} edge="end">
                            {showPassphrase ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText={t.pwd_min_chars}
                  />

                  {passphrase && (
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">{t.fp_strength}</Typography>
                        <Typography variant="caption" color={`${strength.color}.main`} fontWeight={600}>
                          {strengthLabel()}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={strength.score}
                        color={strength.color}
                        sx={{ borderRadius: 1, height: 6 }}
                      />
                    </Box>
                  )}

                  <TextField
                    fullWidth
                    label={t.ssh_confirm_passphrase_label}
                    type={showPassphrase ? 'text' : 'password'}
                    value={confirmPassphrase}
                    onChange={e => setConfirmPassphrase(e.target.value)}
                    error={!!confirmPassphrase && passphrase !== confirmPassphrase}
                    helperText={confirmPassphrase && passphrase !== confirmPassphrase ? t.ssh_passphrase_mismatch : ''}
                  />

                  <Alert severity="info" icon={<Shield />}>
                    <Typography variant="body2">{t.ssh_warning}</Typography>
                  </Alert>
                </Stack>
              </Collapse>
            </Box>

            <Divider />

            <Typography variant="h6">{t.gk_import_title.split(' ')[0]} {t.gk_custom_name_title}</Typography>

            <Box>
              <Typography variant="subtitle1" gutterBottom>{t.gk_custom_name_title}</Typography>
              <TextField
                fullWidth
                placeholder="chave_servidor_producao"
                {...register('custom_name', {
                  required: t.gk_custom_name_required,
                  pattern: { value: /^[a-zA-Z0-9_-]+$/, message: t.gk_name_pattern },
                })}
                error={!!errors.custom_name}
                helperText={errors.custom_name?.message}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom>{t.description}</Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder={t.gk_desc_hint}
                {...register('description')}
              />
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">{t.tags}</Typography>
              </Box>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t.gk_tag_placeholder}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                />
                <Button variant="outlined" size="small" onClick={handleAddTag} disabled={!tagInput.trim()} startIcon={<Add />}>
                  {t.add}
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {tags.map(tag => (
                  <Chip key={tag} label={tag} onDelete={() => setTags(tags.filter(t2 => t2 !== tag))} color="primary" size="small" />
                ))}
              </Stack>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Key />}
              disabled={loading}
              fullWidth
            >
              {loading ? t.ssh_generating : t.ssh_generate_btn}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Result Card */}
      <Collapse in={!!generatedKey}>
        {generatedKey && (
          <Paper sx={{ p: 3, mt: 3, border: '1px solid', borderColor: 'success.main' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <CheckCircle color="success" />
              <Typography variant="h6" color="success.main">{t.ssh_success_title}</Typography>
            </Box>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t.type}: <strong>{keyLabel(generatedKey.key_type, generatedKey.key_size)}</strong>
                  &nbsp;|&nbsp;
                  Passphrase: <strong>{generatedKey.has_passphrase ? t.ssh_passphrase_on : t.ssh_passphrase_off}</strong>
                  {generatedKey.comment && <>&nbsp;|&nbsp; {t.ssh_comment_label}: <strong>{generatedKey.comment}</strong></>}
                </Typography>
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="subtitle2">{t.ssh_pub_key_label} (authorized_keys)</Typography>
                  <Tooltip title={copied ? t.ssh_pub_copied : t.ssh_copy_pub}>
                    <IconButton size="small" onClick={() => handleCopy(generatedKey.public_key_content)} color={copied ? 'success' : 'default'}>
                      {copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1.5,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    wordBreak: 'break-all',
                    overflowX: 'auto',
                  }}
                >
                  {generatedKey.public_key_content}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Paste this line into the <code>~/.ssh/authorized_keys</code> file on the target server.
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Download />}
                  onClick={() => handleDownload(generatedKey.id, 'private', generatedKey.custom_name)}
                >
                  {t.ssh_download_priv}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleDownload(generatedKey.id, 'public', generatedKey.custom_name)}
                >
                  {t.ssh_download_pub}
                </Button>
              </Stack>

              <Alert severity="error" icon={<Warning />}>
                <AlertTitle>{t.ssh_warning}</AlertTitle>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Never share or upload the private key to repositories.</li>
                  <li>Back it up in a secure location (e.g., password manager, encrypted vault).</li>
                  <li>Recommended permission on Linux: <code>chmod 600 ~/.ssh/id_ed25519</code></li>
                  {!generatedKey.has_passphrase && (
                    <li><strong>This key is NOT passphrase-protected — take extra care!</strong></li>
                  )}
                </ul>
              </Alert>
            </Stack>
          </Paper>
        )}
      </Collapse>

      {/* Key List */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>{t.ssh_my_keys_title}</Typography>
        {listLoading ? (
          <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box>
        ) : keys.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" py={3}>
            {t.ssh_no_keys_msg}
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>{t.ssh_col_comment}</TableCell>
                  <TableCell>{t.ssh_col_passphrase}</TableCell>
                  <TableCell>{t.tags}</TableCell>
                  <TableCell>{t.ssh_col_created}</TableCell>
                  <TableCell align="right">{t.actions}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {keys.map(k => (
                  <TableRow key={k.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">{k.custom_name}</Typography>
                      {k.description && (
                        <Typography variant="caption" color="text.secondary">{k.description}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={keyLabel(k.key_type, k.key_size)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">{k.comment || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      {k.has_passphrase
                        ? <Chip icon={<Shield />} label={t.ssh_passphrase_on} size="small" color="success" />
                        : <Chip icon={<Warning />} label={t.ssh_passphrase_off} size="small" color="warning" />
                      }
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {k.tags?.map(tag => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(k.created_at).toLocaleDateString(localeStr)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title={t.ssh_download_priv}>
                          <IconButton size="small" color="error" onClick={() => handleDownload(k.id, 'private', k.custom_name)}>
                            <Download fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t.ssh_copy_pub}>
                          <IconButton size="small" onClick={() => handleCopy(k.public_key_content)}>
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t.delete}>
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(k)}>
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
      </Paper>

      {/* Info Panel */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
          {t.ssh_subtitle}
        </Typography>

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>1. Download the private key and move it to the SSH directory:</Typography>
        <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, mb: 2, fontFamily: 'monospace', fontSize: '0.8rem' }}>
          mv ~/Downloads/my_key ~/.ssh/<br />
          chmod 600 ~/.ssh/my_key
        </Box>

        <Typography variant="subtitle2" gutterBottom>2. Add the public key to the server:</Typography>
        <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, mb: 2, fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {`# Copy the public key line and paste it on the server:`}<br />
          echo "PASTE_PUBLIC_KEY_HERE" {'>> ~/.ssh/authorized_keys'}
        </Box>

        <Typography variant="subtitle2" gutterBottom>3. Connect to the server:</Typography>
        <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, mb: 2, fontFamily: 'monospace', fontSize: '0.8rem' }}>
          ssh -i ~/.ssh/my_key user@server.com
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Ed25519 tip:</strong> The Ed25519 public key is only ~68 characters — much smaller than RSA,
            making the <code>authorized_keys</code> file more readable and authentication faster.
          </Typography>
        </Alert>
      </Paper>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t.ssh_delete_dialog_title}</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>{t.ssh_delete_irreversible_msg}</Alert>
          <Typography variant="body2">
            {t.ssh_delete_confirm} <strong>{deleteTarget?.custom_name}</strong>?
          </Typography>
          {deleteTarget && !deleteTarget.has_passphrase && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {t.ssh_passphrase_off} — {t.ssh_warning}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>{t.cancel}</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? t.ssh_removing : t.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GenerateSSHKey;
