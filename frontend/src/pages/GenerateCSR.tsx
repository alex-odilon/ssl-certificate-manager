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
  FormControlLabel,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Description,
  Info,
  Download,
  Star,
  Add,
  Delete,
  DnsOutlined,
  Language,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';

interface GenerateCSRForm {
  common_name: string;
  country: string;
  state: string;
  locality: string;
  organization: string;
  organizational_unit: string;
  email?: string;
  custom_name: string;
  description: string;
}

const GenerateCSR: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generatedCSR, setGeneratedCSR] = useState<any>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isWildcard, setIsWildcard] = useState(false);
  const [sanDomains, setSanDomains] = useState<string[]>([]);
  const [sanInput, setSanInput] = useState('');
  const [includeCommonNameInSan, setIncludeCommonNameInSan] = useState(true);
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<GenerateCSRForm>();

  const commonName = watch('common_name');

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleAddSanDomain = () => {
    const domain = sanInput.trim();
    if (domain && !sanDomains.includes(domain)) {
      // Validação básica de domínio
      const domainRegex = /^(\*\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (domainRegex.test(domain)) {
        setSanDomains([...sanDomains, domain]);
        setSanInput('');
      } else {
        toast.error('Formato de domínio inválido');
      }
    }
  };

  const handleDeleteSanDomain = (domainToDelete: string) => {
    setSanDomains(sanDomains.filter(domain => domain !== domainToDelete));
  };

  const handleSanInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSanDomain();
    }
  };

  const handleWildcardChange = (checked: boolean) => {
    setIsWildcard(checked);
    if (checked && commonName && !commonName.startsWith('*.')) {
      const wildcardDomain = `*.${commonName}`;
      setValue('common_name', wildcardDomain);
      
      // Adicionar automaticamente o domínio base à lista SAN se não estiver lá
      if (!sanDomains.includes(commonName)) {
        setSanDomains([...sanDomains, commonName]);
      }
    } else if (!checked && commonName && commonName.startsWith('*.')) {
      const baseDomain = commonName.substring(2);
      setValue('common_name', baseDomain);
      
      // Remover o domínio base da lista SAN se estava lá automaticamente
      setSanDomains(sanDomains.filter(d => d !== baseDomain));
    }
  };

  const onSubmit = async (data: GenerateCSRForm) => {
    try {
      setLoading(true);
      
      // Preparar lista completa de domínios SAN
      let finalSanList = [...sanDomains];
      
      // Adicionar o Common Name à lista SAN se a opção estiver marcada
      if (includeCommonNameInSan && data.common_name && !finalSanList.includes(data.common_name)) {
        finalSanList.unshift(data.common_name);
      }
      
      // Se for wildcard, adicionar também o domínio base se não estiver na lista
      if (data.common_name.startsWith('*.')) {
        const baseDomain = data.common_name.substring(2);
        if (!finalSanList.includes(baseDomain)) {
          finalSanList.push(baseDomain);
        }
      }
      
      // Prepare data, removing empty email
      const requestData: any = {
        ...data,
        tags: tags,
        san_domains: finalSanList,
        key_type: keyType,
        key_size: keySize,
      };
      
      // Remove email if empty
      if (!requestData.email || requestData.email.trim() === '') {
        delete requestData.email;
      }
      
const response = await axios.post('/api/csr/generate', requestData);
      
      setGeneratedCSR(response.data);
      toast.success('CSR gerado com sucesso!');
      reset();
      setTags([]);
      setSanDomains([]);
      setIsWildcard(false);
      setIncludeCommonNameInSan(true);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao gerar CSR');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedCSR) return;
    
    try {
      const response = await axios.get(`/api/csr/${generatedCSR.id}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${generatedCSR.custom_name}.csr`);
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
        Gerar CSR
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Gere um Certificate Signing Request (CSR) para solicitar um certificado SSL/TLS.
      </Typography>

      <Paper sx={{ p: 4, mt: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Typography variant="h6">Informações do Certificado</Typography>

            {/* Key Type + Size */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">Tipo de Chave Privada</Typography>
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

            <Divider />

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">Common Name (CN)</Typography>
                <Tooltip title="O domínio principal para o qual você está solicitando o certificado">
                  <IconButton size="small">
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                placeholder="exemplo.com.br"
                {...register('common_name', {
                  required: 'Common Name é obrigatório',
                  pattern: {
                    value: /^(\*\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Formato de domínio inválido',
                  },
                })}
                error={!!errors.common_name}
                helperText={errors.common_name?.message}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isWildcard}
                    onChange={(e) => handleWildcardChange(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Star fontSize="small" />
                    <Typography variant="body2">
                      Certificado Wildcard (*.exemplo.com.br)
                    </Typography>
                  </Box>
                }
                sx={{ mt: 1 }}
              />
            </Box>

            {/* Nova seção para domínios adicionais SAN */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">Domínios Adicionais (SAN)</Typography>
                <Tooltip title="Subject Alternative Names - Permite que o certificado seja válido para múltiplos domínios">
                  <IconButton size="small">
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>SAN (Subject Alternative Names)</strong> permite que um único certificado seja válido para múltiplos domínios.
                </Typography>
                <Typography variant="body2">
                  Exemplo: Se o CN é "exemplo.com.br", você pode adicionar "*.exemplo.com.br" como SAN para cobrir todos os subdomínios.
                </Typography>
              </Alert>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeCommonNameInSan}
                    onChange={(e) => setIncludeCommonNameInSan(e.target.checked)}
                    color="primary"
                  />
                }
                label="Incluir o Common Name na lista SAN automaticamente"
                sx={{ mb: 2 }}
              />

              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Digite um domínio adicional (ex: *.exemplo.com.br)"
                  value={sanInput}
                  onChange={(e) => setSanInput(e.target.value)}
                  onKeyDown={handleSanInputKeyPress}
                  InputProps={{
                    startAdornment: <DnsOutlined sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddSanDomain}
                  disabled={!sanInput.trim()}
                  startIcon={<Add />}
                >
                  Adicionar
                </Button>
              </Box>

              {(sanDomains.length > 0 || (includeCommonNameInSan && commonName)) && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Domínios que serão incluídos no certificado:
                  </Typography>
                  <List dense>
                    {includeCommonNameInSan && commonName && (
                      <ListItem>
                        <ListItemText 
                          primary={commonName}
                          secondary="Common Name (Principal)"
                        />
                        <Chip 
                          label="CN" 
                          size="small" 
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      </ListItem>
                    )}
                    {/* Se for wildcard, mostrar também o domínio base */}
                    {commonName && commonName.startsWith('*.') && !sanDomains.includes(commonName.substring(2)) && (
                      <ListItem>
                        <ListItemText 
                          primary={commonName.substring(2)}
                          secondary="Domínio base (adicionado automaticamente)"
                        />
                        <Chip 
                          label="Auto" 
                          size="small" 
                          color="secondary"
                          sx={{ ml: 1 }}
                        />
                      </ListItem>
                    )}
                    {sanDomains.map((domain, index) => (
                      <ListItem key={domain}>
                        <ListItemText 
                          primary={domain}
                          secondary={`DNS.${includeCommonNameInSan ? index + 2 : index + 1}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            size="small"
                            onClick={() => handleDeleteSanDomain(domain)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>

            <Divider />

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">País (C)</Typography>
                <Tooltip title="Código do país com 2 letras (ex: BR para Brasil)">
                  <IconButton size="small">
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                placeholder="BR"
                {...register('country', {
                  required: 'País é obrigatório',
                  pattern: {
                    value: /^[A-Z]{2}$/,
                    message: 'Use código de 2 letras maiúsculas',
                  },
                })}
                error={!!errors.country}
                helperText={errors.country?.message}
                inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1">Estado/Província (ST)</Typography>
              <TextField
                fullWidth
                placeholder="São Paulo"
                {...register('state', { required: 'Estado é obrigatório' })}
                error={!!errors.state}
                helperText={errors.state?.message}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1">Cidade (L)</Typography>
              <TextField
                fullWidth
                placeholder="São Paulo"
                {...register('locality', { required: 'Cidade é obrigatória' })}
                error={!!errors.locality}
                helperText={errors.locality?.message}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1">Organização (O)</Typography>
              <TextField
                fullWidth
                placeholder="Minha Empresa LTDA"
                {...register('organization', { required: 'Organização é obrigatória' })}
                error={!!errors.organization}
                helperText={errors.organization?.message}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1">Unidade Organizacional (OU)</Typography>
              <TextField
                fullWidth
                placeholder="TI"
                {...register('organizational_unit', { required: 'Unidade é obrigatória' })}
                error={!!errors.organizational_unit}
                helperText={errors.organizational_unit?.message}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1">Email (Opcional)</Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="admin@exemplo.com.br"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Box>

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6">Identificação do Arquivo</Typography>

            <Box>
              <Typography variant="subtitle1">Nome Personalizado</Typography>
              <TextField
                fullWidth
                placeholder="csr_principal_2024"
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
                placeholder="CSR para renovação do certificado principal"
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
              startIcon={loading ? <CircularProgress size={20} /> : <Description />}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Gerando...' : 'Gerar CSR'}
            </Button>
          </Stack>
        </Box>

        {generatedCSR && (
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
                Download CSR
              </Button>
            }
          >
            <Typography variant="subtitle2" gutterBottom>
              CSR gerado com sucesso!
            </Typography>
            <Typography variant="body2">
              Nome: <strong>{generatedCSR.custom_name}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Próximos passos:</strong> Envie este CSR para sua Autoridade Certificadora (CA) 
              para obter seu certificado SSL/TLS.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Nota:</strong> Uma chave privada correspondente também foi gerada e salva automaticamente.
            </Typography>
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
          Sobre SAN (Subject Alternative Names)
        </Typography>
        <Typography variant="body2" paragraph>
          SAN permite que um único certificado seja válido para múltiplos domínios e subdomínios.
        </Typography>
        <Typography variant="body2" component="div">
          <strong>Exemplos comuns:</strong>
          <ul>
            <li>CN: exemplo.com.br + SAN: *.exemplo.com.br (cobre o domínio principal e todos os subdomínios)</li>
            <li>CN: www.exemplo.com + SAN: exemplo.com, api.exemplo.com (múltiplos domínios específicos)</li>
            <li>CN: *.app.com + SAN: app.com, *.api.app.com (wildcard principal + domínio base + outro wildcard)</li>
          </ul>
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Dica:</strong> A maioria das CAs modernas adiciona automaticamente o CN à lista SAN, 
            mas é uma boa prática incluí-lo explicitamente.
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default GenerateCSR;