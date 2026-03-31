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
  IconButton,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  FolderZip,
  Info,
  Download,
  ContentCopy,
  VpnKey,
  Badge,
  Folder,
  CheckCircle,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';

interface GeneratePFXForm {
  certificate_id: number;
  ca_bundle_id: number;
  private_key_id: number;
  custom_name: string;
  description: string;
}

interface FileOption {
  id: number;
  custom_name: string;
  filename: string;
  created_at: string;
}

const GeneratePFX: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generatedPFX, setGeneratedPFX] = useState<any>(null);
  const [pfxPassword, setPfxPassword] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [certificates, setCertificates] = useState<FileOption[]>([]);
  const [caBundles, setCaBundles] = useState<FileOption[]>([]);
  const [privateKeys, setPrivateKeys] = useState<FileOption[]>([]);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GeneratePFXForm>();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const [certsRes, keysRes] = await Promise.all([
        axios.get('/api/certificates/'),
        axios.get('/api/keys/'),
      ]);

      // Separate certificates and CA bundles
      const certs = certsRes.data.filter((f: any) => f.file_type === 'certificate');
      const bundles = certsRes.data.filter((f: any) => f.file_type === 'ca_bundle');

      setCertificates(certs);
      setCaBundles(bundles);
      setPrivateKeys(keysRes.data);
    } catch (error) {
      toast.error('Erro ao carregar arquivos');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const copyPassword = () => {
    if (pfxPassword) {
      navigator.clipboard.writeText(pfxPassword);
      setPasswordCopied(true);
      toast.success('Senha copiada!');
      setTimeout(() => setPasswordCopied(false), 3000);
    }
  };

  const onSubmit = async (data: GeneratePFXForm) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/pfx/generate', {
        ...data,
        tags: tags,
      });
      
      setGeneratedPFX(response.data);
      setPfxPassword(response.data.password_masked);
      toast.success('PFX gerado com sucesso!');
      reset();
      setTags([]);
    } catch (error) {
      toast.error('Erro ao gerar PFX');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedPFX) return;
    
    try {
      const response = await axios.get(`/api/pfx/${generatedPFX.id}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${generatedPFX.custom_name}.pfx`);
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
        Gerar PFX
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Combine certificado, chave privada e CA bundle em um arquivo PFX protegido por senha.
      </Typography>

      <Paper sx={{ p: 4, mt: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Typography variant="h6">Selecione os Arquivos</Typography>
            
            <Controller
              name="certificate_id"
              control={control}
              rules={{ required: 'Certificado é obrigatório' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.certificate_id}>
                  <InputLabel>Certificado</InputLabel>
                  <Select {...field} label="Certificado">
                    <MenuItem value="">
                      <em>Selecione um certificado</em>
                    </MenuItem>
                    {certificates.map((cert) => (
                      <MenuItem key={cert.id} value={cert.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Badge fontSize="small" />
                          <Box>
                            <Typography variant="body2">{cert.custom_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(cert.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.certificate_id && (
                    <Typography variant="caption" color="error">
                      {errors.certificate_id.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="ca_bundle_id"
              control={control}
              rules={{ required: 'CA Bundle é obrigatório' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.ca_bundle_id}>
                  <InputLabel>CA Bundle / Intermediate Certificate</InputLabel>
                  <Select {...field} label="CA Bundle / Intermediate Certificate">
                    <MenuItem value="">
                      <em>Selecione um CA Bundle</em>
                    </MenuItem>
                    {caBundles.map((bundle) => (
                      <MenuItem key={bundle.id} value={bundle.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Folder fontSize="small" />
                          <Box>
                            <Typography variant="body2">{bundle.custom_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(bundle.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.ca_bundle_id && (
                    <Typography variant="caption" color="error">
                      {errors.ca_bundle_id.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="private_key_id"
              control={control}
              rules={{ required: 'Chave privada é obrigatória' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.private_key_id}>
                  <InputLabel>Chave Privada</InputLabel>
                  <Select {...field} label="Chave Privada">
                    <MenuItem value="">
                      <em>Selecione uma chave privada</em>
                    </MenuItem>
                    {privateKeys.map((key) => (
                      <MenuItem key={key.id} value={key.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <VpnKey fontSize="small" />
                          <Box>
                            <Typography variant="body2">{key.custom_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(key.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.private_key_id && (
                    <Typography variant="caption" color="error">
                      {errors.private_key_id.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6">Identificação do Arquivo</Typography>

            <Box>
              <Typography variant="subtitle1">Nome Personalizado</Typography>
              <TextField
                fullWidth
                placeholder="certificado_completo_2024"
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
              <Typography variant="subtitle1">Descrição</Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="PFX completo para instalação no servidor"
                {...register('description')}
              />
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">Tags</Typography>
                <Tooltip title="Adicione tags para facilitar a busca">
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
              startIcon={loading ? <CircularProgress size={20} /> : <FolderZip />}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Gerando...' : 'Gerar PFX'}
            </Button>
          </Stack>
        </Box>

        {generatedPFX && (
          <>
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
                  Download PFX
                </Button>
              }
            >
              <Typography variant="subtitle2" gutterBottom>
                PFX gerado com sucesso!
              </Typography>
              <Typography variant="body2">
                Nome: <strong>{generatedPFX.custom_name}</strong>
              </Typography>
            </Alert>

            <Card sx={{ mt: 2, bgcolor: 'warning.dark' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.contrastText">
                  <VpnKey sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Senha do PFX
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>ATENÇÃO:</strong> Esta senha é exibida apenas uma vez! 
                  Copie e armazene em local seguro.
                </Alert>
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    fullWidth
                    value={pfxPassword}
                    InputProps={{
                      readOnly: true,
                      style: { fontFamily: 'monospace' },
                    }}
                  />
                  <Tooltip title={passwordCopied ? "Copiado!" : "Copiar senha"}>
                    <IconButton
                      onClick={copyPassword}
                      color={passwordCopied ? "success" : "primary"}
                    >
                      {passwordCopied ? <CheckCircle /> : <ContentCopy />}
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Senha: 25 caracteres (letras maiúsculas, minúsculas e números)
                </Typography>
              </CardContent>
            </Card>
          </>
        )}
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
          O que é um arquivo PFX?
        </Typography>
        <Typography variant="body2" paragraph>
          Um arquivo PFX (também conhecido como PKCS#12) é um formato de arquivo que contém:
        </Typography>
        <ul>
          <li><Typography variant="body2">O certificado SSL/TLS</Typography></li>
          <li><Typography variant="body2">A chave privada correspondente</Typography></li>
          <li><Typography variant="body2">A cadeia de certificados intermediários (CA Bundle)</Typography></li>
        </ul>
        <Typography variant="body2" paragraph sx={{ mt: 2 }}>
          Tudo em um único arquivo protegido por senha, facilitando a instalação em servidores 
          Windows/IIS, Exchange, e outros sistemas.
        </Typography>
      </Paper>
    </Box>
  );
};

export default GeneratePFX;