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

// ─── types ────────────────────────────────────────────────────────────────────

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

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Returns 0–100 strength score and a label/color. */
function passphraseStrength(p: string): { score: number; label: string; color: 'error' | 'warning' | 'info' | 'success' } {
  if (!p) return { score: 0, label: '', color: 'error' };
  let score = 0;
  if (p.length >= 8)  score += 20;
  if (p.length >= 12) score += 15;
  if (p.length >= 16) score += 15;
  if (/[a-z]/.test(p)) score += 10;
  if (/[A-Z]/.test(p)) score += 10;
  if (/[0-9]/.test(p)) score += 10;
  if (/[^a-zA-Z0-9]/.test(p)) score += 20;
  score = Math.min(score, 100);
  if (score < 30) return { score, label: 'Fraca', color: 'error' };
  if (score < 55) return { score, label: 'Razoável', color: 'warning' };
  if (score < 80) return { score, label: 'Boa', color: 'info' };
  return { score, label: 'Forte', color: 'success' };
}

function keyLabel(kt: string, ks: number | null): string {
  if (kt === 'ED25519') return 'Ed25519';
  if (kt === 'ECDSA') return `ECDSA P-${ks}`;
  return `RSA ${ks} bits`;
}

const TYPE_INFO: Record<string, string> = {
  Ed25519: 'Moderno e muito seguro. Chave compacta, operações rápidas. Recomendado para novos servidores.',
  RSA: 'Compatível com praticamente todos os sistemas. Use 4096 bits para alta segurança.',
  ECDSA: 'Bom equilíbrio entre tamanho e segurança. Compatível com a maioria dos sistemas modernos.',
};

// ─── component ────────────────────────────────────────────────────────────────

const GenerateSSHKey: React.FC = () => {
  // form state
  const [keyType, setKeyType] = useState<'Ed25519' | 'RSA' | 'ECDSA'>('Ed25519');
  const [keySize, setKeySize] = useState<number>(4096);
  const [usePassphrase, setUsePassphrase] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // result / list state
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<SSHKeyRecord | null>(null);
  const [keys, setKeys] = useState<SSHKeyRecord[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // delete dialog
  const [deleteTarget, setDeleteTarget] = useState<SSHKeyRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const strength = passphraseStrength(passphrase);

  // RSA sizes | ECDSA sizes
  const RSA_SIZES = [2048, 3072, 4096];
  const ECDSA_SIZES = [{ label: 'P-256 (256 bits)', value: 256 }, { label: 'P-384 (384 bits)', value: 384 }];

  // When key type changes, reset size to a sane default
  useEffect(() => {
    if (keyType === 'RSA') setKeySize(4096);
    else if (keyType === 'ECDSA') setKeySize(256);
  }, [keyType]);

  useEffect(() => { loadKeys(); }, []);

  // ── data loading ────────────────────────────────────────────────────────────

  const loadKeys = async () => {
    try {
      setListLoading(true);
      const res = await axios.get('/api/ssh/');
      setKeys(res.data);
    } catch {
      toast.error('Erro ao carregar chaves SSH');
    } finally {
      setListLoading(false);
    }
  };

  // ── tag management ──────────────────────────────────────────────────────────

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(''); }
  };

  // ── copy public key ─────────────────────────────────────────────────────────

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Chave pública copiada!');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  // ── download ────────────────────────────────────────────────────────────────

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
      toast.success('Download iniciado!');
    } catch {
      toast.error('Erro ao fazer download');
    }
  };

  // ── delete ──────────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await axios.delete(`/api/ssh/${deleteTarget.id}`);
      toast.success('Chave SSH removida!');
      setKeys(keys.filter(k => k.id !== deleteTarget.id));
      if (generatedKey?.id === deleteTarget.id) setGeneratedKey(null);
      setDeleteTarget(null);
    } catch {
      toast.error('Erro ao remover chave SSH');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── form submit ─────────────────────────────────────────────────────────────

  const onSubmit = async (data: FormValues) => {
    if (usePassphrase) {
      if (!passphrase) { toast.error('Informe a passphrase'); return; }
      if (passphrase !== confirmPassphrase) { toast.error('As passphrases não coincidem'); return; }
      if (passphrase.length < 8) { toast.error('A passphrase deve ter pelo menos 8 caracteres'); return; }
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
      toast.success('Par de chaves SSH gerado com sucesso!');

      // Reset form
      reset();
      setTags([]);
      setPassphrase('');
      setConfirmPassphrase('');
      setUsePassphrase(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao gerar chave SSH');
    } finally {
      setLoading(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gerar Chaves SSH
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Gere pares de chaves SSH para autenticação em servidores Linux e outros ambientes Unix-like.
        Suporta Ed25519 (recomendado), RSA e ECDSA com proteção opcional por passphrase.
      </Typography>

      {/* ── GENERATOR FORM ─────────────────────────────────────────────────── */}
      <Paper sx={{ p: 4, mt: 2 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>

            {/* Key type */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1" fontWeight={600}>Tipo de Chave</Typography>
                <Tooltip title={TYPE_INFO[keyType]}>
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

              <Alert severity="info" sx={{ mb: keyType !== 'Ed25519' ? 2 : 0 }}>
                <Typography variant="body2">{TYPE_INFO[keyType]}</Typography>
              </Alert>

              {/* Size selector — hidden for Ed25519 */}
              <Collapse in={keyType !== 'Ed25519'}>
                <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                  <InputLabel>{keyType === 'RSA' ? 'Tamanho (bits)' : 'Curva Elíptica'}</InputLabel>
                  <Select
                    value={keySize}
                    label={keyType === 'RSA' ? 'Tamanho (bits)' : 'Curva Elíptica'}
                    onChange={e => setKeySize(Number(e.target.value))}
                  >
                    {keyType === 'RSA'
                      ? RSA_SIZES.map(s => (
                          <MenuItem key={s} value={s}>
                            {s} bits{s === 4096 ? ' (alta segurança)' : s === 2048 ? ' (mínimo recomendado)' : ''}
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
                <Typography variant="subtitle1" fontWeight={600}>Comentário (identificador)</Typography>
                <Tooltip title="Texto opcional adicionado ao final da chave pública. Geralmente no formato user@hostname. Ajuda a identificar de onde veio a chave no authorized_keys do servidor.">
                  <IconButton size="small"><Info fontSize="small" /></IconButton>
                </Tooltip>
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
                  <Typography variant="subtitle1" fontWeight={600}>Proteger com Passphrase</Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={usePassphrase}
                      onChange={e => setUsePassphrase(e.target.checked)}
                      color="success"
                    />
                  }
                  label={usePassphrase ? 'Ativado' : 'Desativado'}
                  labelPlacement="start"
                />
              </Box>

              <Collapse in={!usePassphrase}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle>Atenção — chave sem proteção</AlertTitle>
                  Sem passphrase, qualquer pessoa com acesso ao arquivo da chave privada poderá usá-la imediatamente.
                  Use esta opção apenas em ambientes de CI/CD ou quando a gestão de senhas não é viável.
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
                    helperText="Mínimo 8 caracteres. Use letras maiúsculas, minúsculas, números e símbolos."
                  />

                  {/* Strength bar */}
                  {passphrase && (
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">Força da passphrase</Typography>
                        <Typography variant="caption" color={`${strength.color}.main`} fontWeight={600}>
                          {strength.label}
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
                    label="Confirmar Passphrase"
                    type={showPassphrase ? 'text' : 'password'}
                    value={confirmPassphrase}
                    onChange={e => setConfirmPassphrase(e.target.value)}
                    error={!!confirmPassphrase && passphrase !== confirmPassphrase}
                    helperText={confirmPassphrase && passphrase !== confirmPassphrase ? 'Passphrases não coincidem' : ''}
                  />

                  <Alert severity="info" icon={<Shield />}>
                    <Typography variant="body2">
                      A passphrase <strong>não é armazenada</strong> em nenhum lugar do sistema.
                      Apenas a chave privada cifrada é salva. Guarde sua passphrase em um gerenciador de senhas.
                    </Typography>
                  </Alert>
                </Stack>
              </Collapse>
            </Box>

            <Divider />

            {/* Identification */}
            <Typography variant="h6">Identificação do Arquivo</Typography>

            <Box>
              <Typography variant="subtitle1" gutterBottom>Nome Personalizado</Typography>
              <TextField
                fullWidth
                placeholder="chave_servidor_producao"
                {...register('custom_name', {
                  required: 'Nome é obrigatório',
                  pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Use apenas letras, números, _ e -' },
                })}
                error={!!errors.custom_name}
                helperText={errors.custom_name?.message}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom>Descrição</Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Chave para acesso ao servidor de produção"
                {...register('description')}
              />
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">Tags</Typography>
              </Box>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Digite uma tag e pressione Enter"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                />
                <Button variant="outlined" size="small" onClick={handleAddTag} disabled={!tagInput.trim()} startIcon={<Add />}>
                  Adicionar
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {tags.map(tag => (
                  <Chip key={tag} label={tag} onDelete={() => setTags(tags.filter(t => t !== tag))} color="primary" size="small" />
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
              {loading ? 'Gerando...' : 'Gerar Par de Chaves SSH'}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* ── RESULT CARD ────────────────────────────────────────────────────── */}
      <Collapse in={!!generatedKey}>
        {generatedKey && (
          <Paper sx={{ p: 3, mt: 3, border: '1px solid', borderColor: 'success.main' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <CheckCircle color="success" />
              <Typography variant="h6" color="success.main">Par de Chaves Gerado!</Typography>
            </Box>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Tipo: <strong>{keyLabel(generatedKey.key_type, generatedKey.key_size)}</strong>
                  &nbsp;|&nbsp;
                  Proteção: <strong>{generatedKey.has_passphrase ? 'Passphrase ativada' : 'Sem passphrase'}</strong>
                  {generatedKey.comment && <>&nbsp;|&nbsp; Comentário: <strong>{generatedKey.comment}</strong></>}
                </Typography>
              </Box>

              {/* Public key display */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="subtitle2">Chave Pública (authorized_keys)</Typography>
                  <Tooltip title={copied ? 'Copiado!' : 'Copiar chave pública'}>
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
                  Cole esta linha no arquivo <code>~/.ssh/authorized_keys</code> do servidor de destino.
                </Typography>
              </Box>

              {/* Download buttons */}
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Download />}
                  onClick={() => handleDownload(generatedKey.id, 'private', generatedKey.custom_name)}
                >
                  Baixar Chave Privada
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleDownload(generatedKey.id, 'public', generatedKey.custom_name)}
                >
                  Baixar Chave Pública (.pub)
                </Button>
              </Stack>

              <Alert severity="error" icon={<Warning />}>
                <AlertTitle>Guarde a chave privada com segurança</AlertTitle>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Nunca compartilhe ou suba a chave privada para repositórios.</li>
                  <li>Faça backup em local seguro (ex: gerenciador de senhas, vault criptografado).</li>
                  <li>Permissão recomendada no Linux: <code>chmod 600 ~/.ssh/id_ed25519</code></li>
                  {!generatedKey.has_passphrase && (
                    <li><strong>Esta chave NÃO está protegida por passphrase — tome cuidado extra!</strong></li>
                  )}
                </ul>
              </Alert>
            </Stack>
          </Paper>
        )}
      </Collapse>

      {/* ── KEY LIST ────────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>Minhas Chaves SSH</Typography>
        {listLoading ? (
          <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box>
        ) : keys.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" py={3}>
            Nenhuma chave SSH gerada ainda.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Comentário</TableCell>
                  <TableCell>Passphrase</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Criado em</TableCell>
                  <TableCell align="right">Ações</TableCell>
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
                        ? <Chip icon={<Shield />} label="Protegida" size="small" color="success" />
                        : <Chip icon={<Warning />} label="Sem passphrase" size="small" color="warning" />
                      }
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {k.tags?.map(t => <Chip key={t} label={t} size="small" variant="outlined" />)}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(k.created_at).toLocaleDateString('pt-BR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Baixar chave privada">
                          <IconButton size="small" color="error" onClick={() => handleDownload(k.id, 'private', k.custom_name)}>
                            <Download fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copiar chave pública">
                          <IconButton size="small" onClick={() => handleCopy(k.public_key_content)}>
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
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

      {/* ── INFO PANEL ─────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
          Como usar sua chave SSH
        </Typography>

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>1. Baixe a chave privada e mova para o diretório SSH:</Typography>
        <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, mb: 2, fontFamily: 'monospace', fontSize: '0.8rem' }}>
          mv ~/Downloads/minha_chave ~/.ssh/<br />
          chmod 600 ~/.ssh/minha_chave
        </Box>

        <Typography variant="subtitle2" gutterBottom>2. Adicione a chave pública ao servidor:</Typography>
        <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, mb: 2, fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {`# Copie a linha da chave pública e cole no servidor:`}<br />
          echo "COLE_A_CHAVE_PUBLICA_AQUI" {'>> ~/.ssh/authorized_keys'}
        </Box>

        <Typography variant="subtitle2" gutterBottom>3. Conecte ao servidor:</Typography>
        <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, mb: 2, fontFamily: 'monospace', fontSize: '0.8rem' }}>
          ssh -i ~/.ssh/minha_chave usuario@servidor.com
        </Box>

        <Typography variant="subtitle2" gutterBottom>4. (Opcional) Configure o ~/.ssh/config para facilitar:</Typography>
        <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}>
          Host meu-servidor<br />
          &nbsp;&nbsp;HostName servidor.com<br />
          &nbsp;&nbsp;User ubuntu<br />
          &nbsp;&nbsp;IdentityFile ~/.ssh/minha_chave
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Dica Ed25519:</strong> A chave pública Ed25519 tem apenas ~68 caracteres — muito menor que RSA,
            o que torna o arquivo <code>authorized_keys</code> mais legível e a autenticação mais rápida.
          </Typography>
        </Alert>
      </Paper>

      {/* ── DELETE DIALOG ──────────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Excluir Chave SSH</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Esta ação é irreversível. O arquivo da chave privada será removido do disco.
          </Alert>
          <Typography variant="body2">
            Tem certeza que deseja excluir a chave <strong>{deleteTarget?.custom_name}</strong>?
          </Typography>
          {deleteTarget && !deleteTarget.has_passphrase && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Esta chave não possui passphrase. Certifique-se de que ela não está em uso em nenhum servidor.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? 'Removendo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GenerateSSHKey;
