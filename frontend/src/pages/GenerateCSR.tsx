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
} from '@mui/material';
import {
  Description,
  Info,
  Download,
  Star,
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

  const handleWildcardChange = (checked: boolean) => {
    setIsWildcard(checked);
    if (checked && commonName && !commonName.startsWith('*.')) {
      setValue('common_name', `*.${commonName}`);
    } else if (!checked && commonName && commonName.startsWith('*.')) {
      setValue('common_name', commonName.substring(2));
    }
  };

  const onSubmit = async (data: GenerateCSRForm) => {
    try {
      setLoading(true);
      
      // Prepare data, removing empty email
      const requestData: any = {
        ...data,
        tags: tags,
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
      setIsWildcard(false);
    } catch (error: any) {
      console.error('Erro ao gerar CSR:', error.response?.data);
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
            
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">Common Name (CN)</Typography>
                <Tooltip title="O domínio para o qual você está solicitando o certificado">
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
                  onKeyPress={(e) => {
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
          Sobre Certificados Wildcard
        </Typography>
        <Typography variant="body2" paragraph>
          Um certificado wildcard permite proteger um domínio e todos os seus subdomínios com um único certificado.
        </Typography>
        <ul>
          <li>
            <Typography variant="body2">
              <strong>Certificado Normal:</strong> exemplo.com.br (protege apenas o domínio principal)
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Certificado Wildcard:</strong> *.exemplo.com.br (protege todos os subdomínios como 
              www.exemplo.com.br, api.exemplo.com.br, etc.)
            </Typography>
          </li>
        </ul>
      </Paper>
    </Box>
  );
};

export default GenerateCSR;