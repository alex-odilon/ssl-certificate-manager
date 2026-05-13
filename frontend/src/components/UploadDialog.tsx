import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload,
  Info,
  Close,
  VpnKey,
  Badge,
  Folder,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLanguage } from '../contexts/LanguageContext';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ open, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showPasswordField, setShowPasswordField] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'key' || extension === 'pem') {
        setFileType('');
      } else if (extension === 'crt' || extension === 'cer') {
        setFileType('certificate');
      } else if (extension === 'csr') {
        toast.error(t.upload_csr_err);
        setSelectedFile(null);
      } else if (extension === 'pfx' || extension === 'p12') {
        toast.error(t.upload_pfx_err);
        setSelectedFile(null);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/x-pem-file': ['.pem', '.key', '.crt', '.cer'],
    },
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const validate = () => {
    const newErrors: any = {};
    if (!selectedFile) newErrors.file = t.upload_no_file;
    if (!fileType) newErrors.fileType = t.upload_type_required;
    if (!customName.trim()) {
      newErrors.customName = t.upload_custom_name_required;
    } else if (!/^[a-zA-Z0-9_-]+$/.test(customName)) {
      newErrors.customName = t.upload_name_pattern;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile!);
      formData.append('custom_name', customName);
      formData.append('file_type', fileType);
      formData.append('description', description);
      formData.append('tags', JSON.stringify(tags));

      let endpoint = '';
      if (fileType === 'private_key') {
        endpoint = '/api/keys/upload';
      } else if (fileType === 'certificate' || fileType === 'ca_bundle') {
        endpoint = '/api/certificates/upload';
      }

      await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(t.upload_success);
      onSuccess();
      handleClose();
    } catch (error: any) {
      if (error.response?.data?.detail?.includes('protegida por senha') ||
          error.response?.data?.detail?.includes('encrypted')) {
        setShowPasswordField(true);
        toast.error(t.upload_encrypted_key_err);
      } else {
        toast.error(error.response?.data?.detail || t.upload_err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedFile(null);
      setFileType('');
      setCustomName('');
      setDescription('');
      setTags([]);
      setTagInput('');
      setErrors({});
      setShowPasswordField(false);
      onClose();
    }
  };

  const getFileTypeIcon = () => {
    switch (fileType) {
      case 'private_key': return <VpnKey />;
      case 'certificate': return <Badge />;
      case 'ca_bundle': return <Folder />;
      default: return <CloudUpload />;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{t.upload_title}</Typography>
          <IconButton onClick={handleClose} disabled={loading}><Close /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : errors.file ? 'error.main' : 'divider',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              transition: 'all 0.3s',
            }}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                {getFileTypeIcon()}
                <Typography variant="body1">{selectedFile.name}</Typography>
              </Box>
            ) : (
              <>
                <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" gutterBottom>{t.upload_drop_hint}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Formatos aceitos: .pem, .key, .crt, .cer
                </Typography>
              </>
            )}
          </Box>
          {errors.file && (
            <Typography variant="caption" color="error">{errors.file}</Typography>
          )}

          <FormControl fullWidth error={!!errors.fileType}>
            <InputLabel>{t.upload_select_type}</InputLabel>
            <Select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              label={t.upload_select_type}
              disabled={!selectedFile}
            >
              <MenuItem value="private_key">
                <Box display="flex" alignItems="center" gap={1}>
                  <VpnKey fontSize="small" />
                  <span>{t.files_type_private_key}</span>
                </Box>
              </MenuItem>
              <MenuItem value="certificate">
                <Box display="flex" alignItems="center" gap={1}>
                  <Badge fontSize="small" />
                  <span>{t.files_type_cert}</span>
                </Box>
              </MenuItem>
              <MenuItem value="ca_bundle">
                <Box display="flex" alignItems="center" gap={1}>
                  <Folder fontSize="small" />
                  <span>CA Bundle / Intermediate Certificate</span>
                </Box>
              </MenuItem>
            </Select>
            {errors.fileType && (
              <Typography variant="caption" color="error">{errors.fileType}</Typography>
            )}
          </FormControl>

          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle2">{t.upload_custom_name}</Typography>
              <Tooltip title={t.upload_custom_name}>
                <IconButton size="small"><Info fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
            <TextField
              fullWidth
              placeholder="ex: certificado_producao_2024"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              error={!!errors.customName}
              helperText={errors.customName}
              disabled={loading}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>{t.upload_desc}</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder={t.upload_desc}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </Box>

          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle2">{t.tags}</Typography>
              <Tooltip title={t.tags}>
                <IconButton size="small"><Info fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
            <Box display="flex" gap={1} mb={1}>
              <TextField
                fullWidth
                size="small"
                placeholder={t.upload_tag_placeholder}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={loading}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || loading}
              >
                {t.add}
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
                  disabled={loading}
                />
              ))}
            </Stack>
          </Box>

          {fileType === 'ca_bundle' && (
            <Alert severity="info">
              <strong>CA Bundle:</strong> {t.files_type_ca_bundle}
            </Alert>
          )}

          {fileType === 'private_key' && (
            <>
              <Alert severity="warning">
                <strong>{t.upload_btn}:</strong> {t.upload_encrypted_key_err}<br />
                <code style={{ backgroundColor: '#333', padding: '4px 8px', borderRadius: '4px', display: 'block', marginTop: '8px' }}>
                  openssl rsa -in chave_com_senha.key -out chave_sem_senha.key
                </code>
              </Alert>

              {showPasswordField && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t.upload_encrypted_key_err}
                  </Typography>
                  <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>Abra um terminal</li>
                    <li>Execute o comando acima para remover a senha</li>
                    <li>Use o arquivo resultante para importar</li>
                  </ol>
                </Alert>
              )}
            </>
          )}
        </Stack>

        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>{t.cancel}</Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={loading || !selectedFile || !fileType || !customName}
        >
          {loading ? t.upload_uploading : t.upload_btn}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;
