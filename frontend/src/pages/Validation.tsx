import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Autocomplete,
  Stack,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  VpnKey,
  Badge,
  Description,
  FolderZip,
  Folder,
  ContentCopy,
  Search,
  DnsOutlined,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'react-toastify';

interface ValidationResult {
  file_type: string;
  is_valid: boolean;
  details: any;
  error?: string;
}

interface FileOption {
  id: number;
  custom_name: string;
  file_type: string;
  created_at: string;
  description?: string;
}

const Validation: React.FC = () => {
  const [validationMode, setValidationMode] = useState<'upload' | 'existing'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [selectedFileData, setSelectedFileData] = useState<FileOption | null>(null);
  const [pfxPassword, setPfxPassword] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingFiles, setExistingFiles] = useState<FileOption[]>([]);
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    if (validationMode === 'existing') {
      loadExistingFiles();
    }
  }, [validationMode]);

  // Load PFX password automatically when a PFX file is selected
  useEffect(() => {
    if (selectedFileData && selectedFileData.file_type === 'pfx') {
      loadPfxPassword();
    }
  }, [selectedFileData]);

  const loadExistingFiles = async () => {
    try {
      const response = await axios.get('/api/files/');
      setExistingFiles(response.data);
    } catch (error) {
      toast.error('Erro ao carregar arquivos');
    }
  };

  const loadPfxPassword = async () => {
    if (!selectedFileData || selectedFileData.file_type !== 'pfx') return;
    
    try {
      setLoadingPassword(true);
      const response = await axios.get(`/api/pfx/${selectedFileData.id}/password`);
      setPfxPassword(response.data.password);
      toast.info('Senha do PFX carregada automaticamente');
    } catch (error) {
      console.error('Erro ao carregar senha do PFX:', error);
    } finally {
      setLoadingPassword(false);
    }
  };

  const getFilteredFiles = () => {
    if (fileTypeFilter === 'all') return existingFiles;
    return existingFiles.filter(file => file.file_type === fileTypeFilter);
  };

  const getFileLabel = (file: FileOption) => {
    const date = new Date(file.created_at).toLocaleDateString();
    const type = getFileTypeLabel(file.file_type);
    return `${file.custom_name} - ${type} (${date})`;
  };

  const getFileTypeLabel = (fileType: string) => {
    const labels: Record<string, string> = {
      private_key: 'Chave Privada',
      certificate: 'Certificado',
      ca_bundle: 'CA Bundle',
      csr: 'CSR',
      pfx: 'PFX',
    };
    return labels[fileType] || fileType;
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setValidationResult(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/x-pem-file': ['.pem', '.key', '.crt', '.cer'],
      'application/x-pkcs12': ['.pfx', '.p12'],
      'application/x-x509-ca-cert': ['.csr'],
    },
  });

  const handleValidate = async () => {
    try {
      setLoading(true);
      const formData = new FormData();

      if (validationMode === 'upload' && selectedFile) {
        formData.append('file', selectedFile);
      } else if (validationMode === 'existing' && selectedFileId) {
        formData.append('file_id', selectedFileId.toString());
      }

      if (pfxPassword) {
        formData.append('password', pfxPassword);
      }

      const response = await axios.post('/api/validation/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setValidationResult(response.data);
      
      if (response.data.is_valid) {
        toast.success('Arquivo validado com sucesso!');
      } else {
        toast.error('Arquivo inválido');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao validar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const renderValidationDetails = () => {
    if (!validationResult || !validationResult.details) return null;

    const details = validationResult.details;

    switch (validationResult.file_type) {
      case 'Certificate':
        return (
          <List>
            <ListItem>
              <ListItemText
                primary="Common Name"
                secondary={details.common_name}
                secondaryTypographyProps={{ 
                  component: 'div',
                  sx: { display: 'flex', alignItems: 'center', gap: 1 }
                }}
              />
              <IconButton size="small" onClick={() => copyToClipboard(details.common_name)}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Válido de"
                secondary={new Date(details.not_before).toLocaleString()}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Válido até"
                secondary={new Date(details.not_after).toLocaleString()}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Dias até expirar"
                secondary={
                  <Chip
                    label={details.days_until_expiry}
                    color={details.days_until_expiry > 30 ? 'success' : 'warning'}
                    size="small"
                  />
                }
              />
            </ListItem>
            {details.san && details.san.length > 0 && (
              <ListItem>
                <ListItemText
                  primary="SANs (Subject Alternative Names)"
                  secondary={details.san.join(', ')}
                />
              </ListItem>
            )}
            <ListItem>
              <ListItemText
                primary="Serial Number"
                secondary={details.serial_number}
              />
            </ListItem>
          </List>
        );

      case 'Private Key':
        return (
          <List>
            <ListItem>
              <ListItemText primary="Tipo" secondary={details.key_type} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Tamanho" secondary={`${details.key_size} bits`} />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Modulus (primeiros 50 caracteres)"
                secondary={details.modulus}
              />
            </ListItem>
          </List>
        );

      case 'CSR':
        return (
          <List>
            <ListItem>
              <ListItemText primary="Common Name" secondary={details.common_name} />
            </ListItem>
            {details.san && details.san.length > 0 && (
              <ListItem>
                <ListItemText
                  primary="SANs (Subject Alternative Names)"
                  secondary={
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      {details.san.map((domain: string, index: number) => (
                        <Chip
                          key={index}
                          label={domain}
                          size="small"
                          icon={<DnsOutlined />}
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  }
                />
              </ListItem>
            )}
            {details.extensions && Object.keys(details.extensions).length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <ListItem>
                  <ListItemText 
                    primary="Extensões Solicitadas"
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {Object.entries(details.extensions).map(([key, value]) => (
                          <Box key={key} sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {key}:
                            </Typography>
                            <Typography variant="body2">
                              {Array.isArray(value) ? (value as string[]).join(', ') : String(value)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
              </>
            )}
            <ListItem>
              <ListItemText
                primary="Assinatura válida"
                secondary={
                  <Chip
                    label={details.is_signature_valid ? 'Sim' : 'Não'}
                    color={details.is_signature_valid ? 'success' : 'error'}
                    size="small"
                  />
                }
              />
            </ListItem>
            {details.subject && Object.entries(details.subject).map(([key, value]) => (
              <ListItem key={key}>
                <ListItemText primary={key} secondary={value as string} />
              </ListItem>
            ))}
          </List>
        );

      case 'PFX/PKCS12':
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Senha do PFX está correta!
            </Alert>
            {details.certificate_info && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Informações do Certificado:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Common Name"
                      secondary={details.certificate_info.common_name}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Válido até"
                      secondary={new Date(details.certificate_info.not_after).toLocaleString()}
                    />
                  </ListItem>
                </List>
              </>
            )}
          </Box>
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Tipo de arquivo: {validationResult.file_type}
          </Typography>
        );
    }
  };

  const getFileIcon = (fileType: string) => {
    const icons: Record<string, JSX.Element> = {
      private_key: <VpnKey />,
      certificate: <Badge />,
      ca_bundle: <Folder />,
      csr: <Description />,
      pfx: <FolderZip />,
    };
    return icons[fileType] || <Folder />;
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Validar Arquivos
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Valide certificados, chaves privadas, CSRs e arquivos PFX sem armazená-los.
      </Typography>

      <Paper sx={{ p: 4, mt: 3 }}>
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={validationMode}
            onChange={(e) => {
              setValidationMode(e.target.value as 'upload' | 'existing');
              setSelectedFile(null);
              setSelectedFileId(null);
              setSelectedFileData(null);
              setValidationResult(null);
              setPfxPassword('');
            }}
          >
            <FormControlLabel
              value="upload"
              control={<Radio />}
              label="Upload de arquivo"
            />
            <FormControlLabel
              value="existing"
              control={<Radio />}
              label="Arquivo existente"
            />
          </RadioGroup>
        </FormControl>

        <Box sx={{ mt: 3 }}>
          {validationMode === 'upload' ? (
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                transition: 'all 0.3s',
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              {selectedFile ? (
                <Typography variant="body1">
                  Arquivo selecionado: <strong>{selectedFile.name}</strong>
                </Typography>
              ) : (
                <>
                  <Typography variant="body1" gutterBottom>
                    Arraste um arquivo aqui ou clique para selecionar
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Formatos aceitos: .pem, .key, .crt, .cer, .csr, .pfx, .p12
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Filtrar por tipo</InputLabel>
                <Select
                  value={fileTypeFilter}
                  onChange={(e) => setFileTypeFilter(e.target.value)}
                  label="Filtrar por tipo"
                >
                  <MenuItem value="all">Todos os tipos</MenuItem>
                  <MenuItem value="private_key">
                    <Box display="flex" alignItems="center" gap={1}>
                      <VpnKey fontSize="small" />
                      <span>Chaves Privadas</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="certificate">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Badge fontSize="small" />
                      <span>Certificados</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="ca_bundle">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Folder fontSize="small" />
                      <span>CA Bundles</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="csr">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Description fontSize="small" />
                      <span>CSRs</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="pfx">
                    <Box display="flex" alignItems="center" gap={1}>
                      <FolderZip fontSize="small" />
                      <span>PFX</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
              
              <Autocomplete
                options={getFilteredFiles()}
                getOptionLabel={getFileLabel}
                value={selectedFileData}
                onChange={(event, newValue) => {
                  setSelectedFileData(newValue);
                  setSelectedFileId(newValue?.id || null);
                  if (!newValue || newValue.file_type !== 'pfx') {
                    setPfxPassword('');
                  }
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box display="flex" alignItems="center" gap={1} width="100%">
                      {getFileIcon(option.file_type)}
                      <Box flex={1}>
                        <Typography variant="body2">{option.custom_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getFileTypeLabel(option.file_type)} • {new Date(option.created_at).toLocaleDateString()}
                          {option.description && ` • ${option.description}`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Selecione um arquivo"
                    placeholder="Digite para buscar..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Box>
          )}
        </Box>

        {((selectedFile && selectedFile.name.match(/\.(pfx|p12)$/i)) ||
          (selectedFileData && selectedFileData.file_type === 'pfx')) && (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              type="password"
              label="Senha do PFX"
              value={pfxPassword}
              onChange={(e) => setPfxPassword(e.target.value)}
              helperText={loadingPassword ? "Carregando senha..." : "Digite a senha do arquivo PFX"}
              disabled={loadingPassword}
              InputProps={{
                endAdornment: loadingPassword && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}

        <Button
          variant="contained"
          size="large"
          fullWidth
          sx={{ mt: 3 }}
          onClick={handleValidate}
          disabled={loading || (!selectedFile && !selectedFileId)}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
        >
          {loading ? 'Validando...' : 'Validar Arquivo'}
        </Button>
      </Paper>

      {validationResult && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              {validationResult.is_valid ? (
                <CheckCircle color="success" sx={{ fontSize: 32 }} />
              ) : (
                <ErrorIcon color="error" sx={{ fontSize: 32 }} />
              )}
              <Box>
                <Typography variant="h6">
                  {validationResult.is_valid ? 'Arquivo Válido' : 'Arquivo Inválido'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tipo: {validationResult.file_type}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {validationResult.error ? (
              <Alert severity="error">{validationResult.error}</Alert>
            ) : (
              renderValidationDetails()
            )}
          </CardContent>
        </Card>
      )}

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
          Sobre a Validação
        </Typography>
        <Typography variant="body2" paragraph>
          Esta ferramenta permite validar arquivos SSL/TLS sem armazená-los no servidor:
        </Typography>
        <ul>
          <li>
            <Typography variant="body2">
              <strong>Certificados:</strong> Verifica validade, datas de expiração e informações do domínio
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Chaves Privadas:</strong> Confirma integridade e exibe informações técnicas
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>CSRs:</strong> Valida assinatura e exibe dados da solicitação
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>PFX:</strong> Verifica senha e exibe certificado contido
            </Typography>
          </li>
        </ul>
      </Paper>
    </Box>
  );
};

export default Validation;