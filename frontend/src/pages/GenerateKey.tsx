import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  VpnKey,
  Info,
  Download,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';

interface GenerateKeyForm {
  custom_name: string;
  description: string;
  tags: string;
}

const GenerateKey: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<any>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [keyType, setKeyType] = useState<'RSA' | 'EC'>('RSA');
  const [keySize, setKeySize] = useState<number>(2048);

  const RSA_SIZES = [2048, 3072, 4096];
  const EC_SIZES = [{ label: 'P-256 (256 bits)', value: 256 }, { label: 'P-384 (384 bits)', value: 384 }];

  const handleKeyTypeChange = (_: any, newType: 'RSA' | 'EC' | null) => {
    if (!newType) return;
    setKeyType(newType);
    setKeySize(newType === 'RSA' ? 2048 : 256);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GenerateKeyForm>();

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const onSubmit = async (data: GenerateKeyForm) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/keys/generate', {
        custom_name: data.custom_name,
        description: data.description,
        tags: tags,
        key_type: keyType,
        key_size: keySize,
      });
      
      setGeneratedKey(response.data);
      toast.success('Chave privada gerada com sucesso!');
      reset();
      setTags([]);
    } catch (error) {
      toast.error('Erro ao gerar chave privada');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedKey) return;
    
    try {
      const response = await axios.get(`/api/keys/${generatedKey.id}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${generatedKey.custom_name}.pem`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao fazer download');
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gerar Chave Privada
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Gere uma nova chave privada para uso em certificados SSL/TLS. Suporta RSA (2048/3072/4096 bits) e Elliptic Curve (P-256/P-384).
      </Typography>

      <Paper sx={{ p: 4, mt: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            {/* Key Type + Size */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">Tipo de Chave</Typography>
                <Tooltip title="RSA é o padrão mais compatível. EC (Elliptic Curve) é mais moderno e eficiente.">
                  <IconButton size="small"><Info fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
              <ToggleButtonGroup
                value={keyType}
                exclusive
                onChange={handleKeyTypeChange}
                size="small"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="RSA">RSA</ToggleButton>
                <ToggleButton value="EC">EC (Elliptic Curve)</ToggleButton>
              </ToggleButtonGroup>

              <FormControl fullWidth size="small">
                <InputLabel>
                  {keyType === 'RSA' ? 'Tamanho da Chave (bits)' : 'Curva Elíptica'}
                </InputLabel>
                <Select
                  value={keySize}
                  label={keyType === 'RSA' ? 'Tamanho da Chave (bits)' : 'Curva Elíptica'}
                  onChange={(e) => setKeySize(Number(e.target.value))}
                >
                  {keyType === 'RSA'
                    ? RSA_SIZES.map((s) => (
                        <MenuItem key={s} value={s}>{s} bits{s === 2048 ? ' (padrão)' : s === 4096 ? ' (alta segurança)' : ''}</MenuItem>
                      ))
                    : EC_SIZES.map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}{s.value === 256 ? ' (padrão)' : ''}</MenuItem>
                      ))
                  }
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">Nome Personalizado</Typography>
                <Tooltip title="Digite um nome único para identificar facilmente esta chave">
                  <IconButton size="small">
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                placeholder="Ex: chave_principal_2024"
                {...register('custom_name', {
                  required: 'Nome é obrigatório',
                  pattern: {
                    value: /^[a-zA-Z0-9_-]+$/,
                    message: 'Use apenas letras, números, _ e -',
                  },
                })}
                error={!!errors.custom_name}
                helperText={errors.custom_name?.message}
              />
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">Descrição</Typography>
                <Tooltip title="Adicione uma descrição para lembrar o propósito desta chave">
                  <IconButton size="small">
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Ex: Chave para o certificado do domínio principal"
                {...register('description')}
              />
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">Tags</Typography>
                <Tooltip title="Adicione tags para facilitar a busca e organização">
                  <IconButton size="small">
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Digite uma tag e pressione Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Adicionar
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    color="primary"
                    size="small"
                  />
                ))}
              </Stack>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <VpnKey />}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Gerando...' : 'Gerar Chave Privada'}
            </Button>
          </Stack>
        </Box>

        {generatedKey && (
          <Alert
            severity="success"
            sx={{ mt: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<Download />}
                onClick={handleDownload}
              >
                Download
              </Button>
            }
          >
            <Typography variant="subtitle2" gutterBottom>
              Chave privada gerada com sucesso!
            </Typography>
            <Typography variant="body2">
              Nome: <strong>{generatedKey.custom_name}</strong>
            </Typography>
            <Typography variant="body2">
              Tipo: <strong>{keyType}</strong> &nbsp;|&nbsp; Tamanho: <strong>{keyType === 'EC' ? `P-${keySize}` : `${keySize} bits`}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Importante:</strong> Faça o download e armazene sua chave privada em local seguro.
              Ela é essencial para usar certificados SSL/TLS.
            </Typography>
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
          Informações sobre Chaves Privadas
        </Typography>
        <Typography variant="body2" paragraph>
          Uma chave privada RSA é um componente fundamental da criptografia SSL/TLS. 
          Ela é usada para:
        </Typography>
        <ul>
          <li><Typography variant="body2">Gerar Certificate Signing Requests (CSRs)</Typography></li>
          <li><Typography variant="body2">Descriptografar dados criptografados com a chave pública correspondente</Typography></li>
          <li><Typography variant="body2">Criar assinaturas digitais para autenticação</Typography></li>
        </ul>
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Segurança:</strong> Nunca compartilhe sua chave privada! 
          Mantenha-a segura e faça backups em locais protegidos.
        </Alert>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Importando Chaves Existentes
        </Typography>
        <Typography variant="body2" paragraph>
          Se você já possui uma chave privada e deseja importá-la, certifique-se de que ela não está protegida por senha.
        </Typography>
        <Typography variant="body2" paragraph>
          Para remover a senha de uma chave privada:
        </Typography>
        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 2 }}>
          <code>openssl rsa -in chave_com_senha.key -out chave_sem_senha.key</code>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Você será solicitado a digitar a senha atual da chave. O arquivo resultante não terá senha.
        </Typography>
      </Paper>
    </Box>
  );
};

export default GenerateKey;