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
import { useLanguage } from '../contexts/LanguageContext';

interface GenerateKeyForm {
  custom_name: string;
  description: string;
  tags: string;
}

const GenerateKey: React.FC = () => {
  const { t } = useLanguage();
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
      toast.success(t.gk_success_gen);
      reset();
      setTags([]);
    } catch (error) {
      toast.error(t.gk_err_gen);
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
      toast.success(t.gk_success_dl);
    } catch (error) {
      toast.error(t.gk_err_dl);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t.gk_title}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {t.gk_subtitle}
      </Typography>

      <Paper sx={{ p: 4, mt: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">{t.gk_key_type_title}</Typography>
                <Tooltip title={t.gk_key_type_hint}>
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
                  {keyType === 'RSA' ? t.gk_key_size_rsa : t.gk_key_size_ec}
                </InputLabel>
                <Select
                  value={keySize}
                  label={keyType === 'RSA' ? t.gk_key_size_rsa : t.gk_key_size_ec}
                  onChange={(e) => setKeySize(Number(e.target.value))}
                >
                  {keyType === 'RSA'
                    ? RSA_SIZES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s} bits{s === 2048 ? ` (${t.gk_default})` : s === 4096 ? ` (${t.gk_high_security})` : ''}
                        </MenuItem>
                      ))
                    : EC_SIZES.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                          {s.label}{s.value === 256 ? ` (${t.gk_default})` : ''}
                        </MenuItem>
                      ))
                  }
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">{t.gk_custom_name_title}</Typography>
                <Tooltip title={t.gk_custom_name_hint}>
                  <IconButton size="small"><Info fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                placeholder="Ex: chave_principal_2024"
                {...register('custom_name', {
                  required: t.gk_custom_name_required,
                  pattern: {
                    value: /^[a-zA-Z0-9_-]+$/,
                    message: t.gk_name_pattern,
                  },
                })}
                error={!!errors.custom_name}
                helperText={errors.custom_name?.message}
              />
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">{t.gk_desc_title}</Typography>
                <Tooltip title={t.gk_desc_hint}>
                  <IconButton size="small"><Info fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder={t.gk_desc_hint}
                {...register('description')}
              />
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">{t.tags}</Typography>
                <Tooltip title={t.gk_tags_hint}>
                  <IconButton size="small"><Info fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t.gk_tag_placeholder}
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
              {loading ? t.gk_generating : t.gk_generate_btn}
            </Button>
          </Stack>
        </Box>

        {generatedKey && (
          <Alert
            severity="success"
            sx={{ mt: 3 }}
            action={
              <Button color="inherit" size="small" startIcon={<Download />} onClick={handleDownload}>
                {t.download}
              </Button>
            }
          >
            <Typography variant="subtitle2" gutterBottom>{t.gk_success_title}</Typography>
            <Typography variant="body2">
              {t.name}: <strong>{generatedKey.custom_name}</strong>
            </Typography>
            <Typography variant="body2">
              {t.gk_success_type}: <strong>{keyType}</strong> &nbsp;|&nbsp; {t.gk_success_size}: <strong>{keyType === 'EC' ? `P-${keySize}` : `${keySize} bits`}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {t.gk_success_important}
            </Typography>
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
          {t.gk_info_title}
        </Typography>
        <Typography variant="body2" paragraph>{t.gk_info_desc}</Typography>
        <ul>
          <li><Typography variant="body2">{t.gk_info_li1}</Typography></li>
          <li><Typography variant="body2">{t.gk_info_li2}</Typography></li>
          <li><Typography variant="body2">{t.gk_info_li3}</Typography></li>
        </ul>
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>{t.gk_security_warning}</strong>
        </Alert>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>{t.gk_import_title}</Typography>
        <Typography variant="body2" paragraph>{t.gk_import_desc}</Typography>
        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, mb: 2 }}>
          <code>openssl rsa -in chave_com_senha.key -out chave_sem_senha.key</code>
        </Box>
        <Typography variant="caption" color="text.secondary">{t.gk_import_note}</Typography>
      </Paper>
    </Box>
  );
};

export default GenerateKey;
