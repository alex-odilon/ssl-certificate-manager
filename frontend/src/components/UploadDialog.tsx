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

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ open, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [keyPassword, setKeyPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      
      // Auto-detect file type based on extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'key' || extension === 'pem') {
        // Could be private key, certificate, or CA bundle
        setFileType(''); // Let user choose
      } else if (extension === 'crt' || extension === 'cer') {
        setFileType('certificate');
      } else if (extension === 'csr') {
        toast.error('CSR deve ser gerado pela plataforma, não importado');
        setSelectedFile(null);
      } else if (extension === 'pfx' || extension === 'p12') {
        toast.error('PFX deve ser gerado pela plataforma, não importado');
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
    
    if (!selectedFile) {
      newErrors.file = 'Arquivo é obrigatório';
    }
    
    if (!fileType) {
      newErrors.fileType = 'Tipo de arquivo é obrigatório';
    }
    
    if (!customName.trim()) {
      newErrors.customName = 'Nome personalizado é obrigatório';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(customName)) {
      newErrors.customName = 'Use apenas letras, números, _ e -';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!validate()) {
      return;
    }

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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Arquivo importado com sucesso!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Upload error:', error.response?.data);
      
      // Check if it's an encrypted key error
      if (error.response?.data?.detail?.includes('protegida por senha') || 
          error.response?.data?.detail?.includes('encrypted')) {
        setShowPasswordField(true);
        toast.error('Esta chave privada está protegida por senha. Por favor, remova a senha antes de importar.');
      } else {
        toast.error(error.response?.data?.detail || 'Erro ao importar arquivo');
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
      setKeyPassword('');
      setShowPasswordField(false);
      onClose();
    }
  };

  const getFileTypeIcon = () => {
    switch (fileType) {
      case 'private_key':
        return <VpnKey />;
      case 'certificate':
        return <Badge />;
      case 'ca_bundle':
        return <Folder />;
      default:
        return <CloudUpload />;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Importar Arquivo</Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* File Upload */}
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
                <Typography variant="body1">
                  {selectedFile.name}
                </Typography>
              </Box>
            ) : (
              <>
                <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                  Arraste um arquivo aqui ou clique para selecionar
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Formatos aceitos: .pem, .key, .crt, .cer
                </Typography>
              </>
            )}
          </Box>
          {errors.file && (
            <Typography variant="caption" color="error">
              {errors.file}
            </Typography>
          )}

          {/* File Type Selection */}
          <FormControl fullWidth error={!!errors.fileType}>
            <InputLabel>Tipo de Arquivo</InputLabel>
            <Select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              label="Tipo de Arquivo"
              disabled={!selectedFile}
            >
              <MenuItem value="private_key">
                <Box display="flex" alignItems="center" gap={1}>
                  <VpnKey fontSize="small" />
                  <span>Chave Privada</span>
                </Box>
              </MenuItem>
              <MenuItem value="certificate">
                <Box display="flex" alignItems="center" gap={1}>
                  <Badge fontSize="small" />
                  <span>Certificado</span>
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
              <Typography variant="caption" color="error">
                {errors.fileType}
              </Typography>
            )}
          </FormControl>

          {/* Custom Name */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle2">Nome Personalizado</Typography>
              <Tooltip title="Digite um nome único para identificar este arquivo">
                <IconButton size="small">
                  <Info fontSize="small" />
                </IconButton>
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

          {/* Description */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Descrição
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Adicione uma descrição para este arquivo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </Box>

          {/* Tags */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle2">Tags</Typography>
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
                disabled={loading}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || loading}
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
                  disabled={loading}
                />
              ))}
            </Stack>
          </Box>

          {fileType === 'ca_bundle' && (
            <Alert severity="info">
              <strong>CA Bundle:</strong> Este arquivo contém certificados intermediários 
              necessários para formar a cadeia completa de certificação.
            </Alert>
          )}
          
          {fileType === 'private_key' && (
            <>
              <Alert severity="warning">
                <strong>Importante:</strong> A chave privada deve estar sem senha. 
                Se sua chave estiver protegida, remova a senha com o comando:<br/>
                <code style={{ backgroundColor: '#333', padding: '4px 8px', borderRadius: '4px', display: 'block', marginTop: '8px' }}>
                  openssl rsa -in chave_com_senha.key -out chave_sem_senha.key
                </code>
              </Alert>
              
              {showPasswordField && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Chave Privada Protegida Detectada
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Esta chave está protegida por senha e não pode ser importada diretamente.
                    Por favor, siga estes passos:
                  </Typography>
                  <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>Abra um terminal</li>
                    <li>Execute o comando acima para remover a senha</li>
                    <li>Use o arquivo resultante (chave_sem_senha.key) para importar</li>
                  </ol>
                </Alert>
              )}
            </>
          )}
        </Stack>

        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={loading || !selectedFile || !fileType || !customName}
        >
          {loading ? 'Importando...' : 'Importar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDialog;