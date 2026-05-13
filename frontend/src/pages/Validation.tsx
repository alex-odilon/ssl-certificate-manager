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
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t, lang } = useLanguage();
  const localeStr = lang === 'pt-BR' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';

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
    if (validationMode === 'existing') loadExistingFiles();
  }, [validationMode]);

  useEffect(() => {
    if (selectedFileData && selectedFileData.file_type === 'pfx') loadPfxPassword();
  }, [selectedFileData]);

  const loadExistingFiles = async () => {
    try {
      const response = await axios.get('/api/files/');
      setExistingFiles(response.data);
    } catch (error) {
      toast.error(t.val_err_load);
    }
  };

  const loadPfxPassword = async () => {
    if (!selectedFileData || selectedFileData.file_type !== 'pfx') return;
    try {
      setLoadingPassword(true);
      const response = await axios.get(`/api/pfx/${selectedFileData.id}/password`);
      setPfxPassword(response.data.password);
    } catch {
      // silent
    } finally {
      setLoadingPassword(false);
    }
  };

  const getFilteredFiles = () => {
    if (fileTypeFilter === 'all') return existingFiles;
    return existingFiles.filter(file => file.file_type === fileTypeFilter);
  };

  const getFileTypeLabel = (fileType: string) => {
    const labels: Record<string, string> = {
      private_key: t.files_type_private_key,
      certificate: t.files_type_cert,
      ca_bundle: t.files_type_ca_bundle,
      csr: t.files_type_csr,
      pfx: t.files_type_pfx,
    };
    return labels[fileType] || fileType;
  };

  const getFileLabel = (file: FileOption) => {
    const date = new Date(file.created_at).toLocaleDateString(localeStr);
    const type = getFileTypeLabel(file.file_type);
    return `${file.custom_name} - ${type} (${date})`;
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
      if (pfxPassword) formData.append('password', pfxPassword);

      const response = await axios.post('/api/validation/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValidationResult(response.data);
      if (response.data.is_valid) {
        toast.success(t.val_valid);
      } else {
        toast.error(t.val_invalid);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t.val_err_validate);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t.copy);
  };

  const renderValidationDetails = () => {
    if (!validationResult || !validationResult.details) return null;
    const details = validationResult.details;

    switch (validationResult.file_type) {
      case 'Certificate':
        return (
          <List>
            <ListItem>
              <ListItemText primary="Common Name" secondary={details.common_name} />
              <IconButton size="small" onClick={() => copyToClipboard(details.common_name)}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </ListItem>
            <ListItem>
              <ListItemText primary="Valid from" secondary={new Date(details.not_before).toLocaleString(localeStr)} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Valid until" secondary={new Date(details.not_after).toLocaleString(localeStr)} />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Days until expiry"
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
                <ListItemText primary="SANs (Subject Alternative Names)" secondary={details.san.join(', ')} />
              </ListItem>
            )}
            <ListItem>
              <ListItemText primary="Serial Number" secondary={details.serial_number} />
            </ListItem>
          </List>
        );

      case 'Private Key':
        return (
          <List>
            <ListItem>
              <ListItemText primary={t.type} secondary={details.key_type} />
            </ListItem>
            <ListItem>
              <ListItemText primary={t.gk_success_size} secondary={`${details.key_size} bits`} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Modulus" secondary={details.modulus} />
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
            <ListItem>
              <ListItemText
                primary="Valid signature"
                secondary={
                  <Chip
                    label={details.is_signature_valid ? 'Yes' : 'No'}
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
            <Alert severity="success" sx={{ mb: 2 }}>PFX password is correct!</Alert>
            {details.certificate_info && (
              <>
                <Typography variant="subtitle1" gutterBottom>Certificate Information:</Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Common Name" secondary={details.certificate_info.common_name} />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Valid until"
                      secondary={new Date(details.certificate_info.not_after).toLocaleString(localeStr)}
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
            {t.type}: {validationResult.file_type}
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
      <Typography variant="h4" component="h1" gutterBottom>{t.val_title}</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>{t.val_subtitle}</Typography>

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
            <FormControlLabel value="upload" control={<Radio />} label={t.val_mode_upload} />
            <FormControlLabel value="existing" control={<Radio />} label={t.val_mode_existing} />
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
                  {t.val_file_selected_prefix} <strong>{selectedFile.name}</strong>
                </Typography>
              ) : (
                <>
                  <Typography variant="body1" gutterBottom>{t.val_upload_hint}</Typography>
                  <Typography variant="caption" color="text.secondary">{t.val_accepted_formats}</Typography>
                </>
              )}
            </Box>
          ) : (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{t.val_file_type_label}</InputLabel>
                <Select
                  value={fileTypeFilter}
                  onChange={(e) => setFileTypeFilter(e.target.value)}
                  label={t.val_file_type_label}
                >
                  <MenuItem value="all">{t.val_file_all}</MenuItem>
                  <MenuItem value="private_key">
                    <Box display="flex" alignItems="center" gap={1}>
                      <VpnKey fontSize="small" /><span>{t.files_type_private_key}</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="certificate">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Badge fontSize="small" /><span>{t.files_type_cert}</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="ca_bundle">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Folder fontSize="small" /><span>{t.files_type_ca_bundle}</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="csr">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Description fontSize="small" /><span>{t.files_type_csr}</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="pfx">
                    <Box display="flex" alignItems="center" gap={1}>
                      <FolderZip fontSize="small" /><span>{t.files_type_pfx}</span>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Autocomplete
                options={getFilteredFiles()}
                getOptionLabel={getFileLabel}
                value={selectedFileData}
                onChange={(_event, newValue) => {
                  setSelectedFileData(newValue);
                  setSelectedFileId(newValue?.id || null);
                  if (!newValue || newValue.file_type !== 'pfx') setPfxPassword('');
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box display="flex" alignItems="center" gap={1} width="100%">
                      {getFileIcon(option.file_type)}
                      <Box flex={1}>
                        <Typography variant="body2">{option.custom_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getFileTypeLabel(option.file_type)} • {new Date(option.created_at).toLocaleDateString(localeStr)}
                          {option.description && ` • ${option.description}`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t.search}
                    placeholder={`${t.search}...`}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start"><Search /></InputAdornment>
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
              label={t.val_pfx_pwd_label}
              value={pfxPassword}
              onChange={(e) => setPfxPassword(e.target.value)}
              helperText={loadingPassword ? t.val_pfx_loading_pwd : ''}
              disabled={loadingPassword}
              InputProps={{
                endAdornment: loadingPassword && (
                  <InputAdornment position="end"><CircularProgress size={20} /></InputAdornment>
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
          {loading ? t.val_validating : t.val_validate_btn}
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
                  {validationResult.is_valid ? t.val_valid : t.val_invalid}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.type}: {validationResult.file_type}
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
          {t.val_cert_details}
        </Typography>
        <Typography variant="body2" paragraph>{t.val_subtitle}</Typography>
        <ul>
          <li><Typography variant="body2"><strong>{t.files_type_cert}:</strong> {t.val_cert_details}</Typography></li>
          <li><Typography variant="body2"><strong>{t.files_type_private_key}:</strong> {t.val_cert_match}</Typography></li>
          <li><Typography variant="body2"><strong>{t.files_type_csr}:</strong> CSR validation</Typography></li>
          <li><Typography variant="body2"><strong>{t.files_type_pfx}:</strong> PFX validation</Typography></li>
        </ul>
      </Paper>
    </Box>
  );
};

export default Validation;
