import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Chip, Stack, Alert,
  IconButton, Tooltip, CircularProgress, FormControl, InputLabel,
  Select, MenuItem, Card, CardContent, Divider,
} from '@mui/material';
import {
  FolderZip, Info, Download, ContentCopy, VpnKey, Badge, Folder, CheckCircle,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [generatedPFX, setGeneratedPFX] = useState<any>(null);
  const [pfxPassword, setPfxPassword] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [certificates, setCertificates] = useState<FileOption[]>([]);
  const [caBundles, setCaBundles] = useState<FileOption[]>([]);
  const [privateKeys, setPrivateKeys] = useState<FileOption[]>([]);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<GeneratePFXForm>();

  useEffect(() => { loadFiles(); }, []);

  const loadFiles = async () => {
    try {
      const [certsRes, keysRes] = await Promise.all([
        axios.get('/api/certificates/'),
        axios.get('/api/keys/'),
      ]);
      setCertificates(certsRes.data.filter((f: any) => f.file_type === 'certificate'));
      setCaBundles(certsRes.data.filter((f: any) => f.file_type === 'ca_bundle'));
      setPrivateKeys(keysRes.data);
    } catch {
      toast.error(t.pfx_err_load);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const copyPassword = () => {
    if (pfxPassword) {
      navigator.clipboard.writeText(pfxPassword);
      setPasswordCopied(true);
      toast.success(t.pfx_pwd_copied);
      setTimeout(() => setPasswordCopied(false), 3000);
    }
  };

  const onSubmit = async (data: GeneratePFXForm) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/pfx/generate', { ...data, tags });
      setGeneratedPFX(response.data);
      setPfxPassword(response.data.password_masked);
      toast.success(t.pfx_success_gen);
      reset();
      setTags([]);
    } catch {
      toast.error(t.pfx_err_gen);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedPFX) return;
    try {
      const response = await axios.get(`/api/pfx/${generatedPFX.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${generatedPFX.custom_name}.pfx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t.pfx_success_dl);
    } catch {
      toast.error(t.pfx_err_dl);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>{t.pfx_title}</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>{t.pfx_subtitle}</Typography>

      <Paper sx={{ p: 4, mt: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Typography variant="h6">{t.pfx_select_section}</Typography>

            <Controller
              name="certificate_id" control={control}
              rules={{ required: t.pfx_cert_required }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.certificate_id}>
                  <InputLabel>{t.files_type_cert}</InputLabel>
                  <Select {...field} label={t.files_type_cert}>
                    <MenuItem value=""><em>{t.pfx_select_cert}</em></MenuItem>
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
                    <Typography variant="caption" color="error">{errors.certificate_id.message}</Typography>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="ca_bundle_id" control={control}
              rules={{ required: t.pfx_ca_required }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.ca_bundle_id}>
                  <InputLabel>CA Bundle / Intermediate Certificate</InputLabel>
                  <Select {...field} label="CA Bundle / Intermediate Certificate">
                    <MenuItem value=""><em>{t.pfx_select_ca}</em></MenuItem>
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
                    <Typography variant="caption" color="error">{errors.ca_bundle_id.message}</Typography>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="private_key_id" control={control}
              rules={{ required: t.pfx_key_required }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.private_key_id}>
                  <InputLabel>{t.files_type_private_key}</InputLabel>
                  <Select {...field} label={t.files_type_private_key}>
                    <MenuItem value=""><em>{t.pfx_select_key}</em></MenuItem>
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
                    <Typography variant="caption" color="error">{errors.private_key_id.message}</Typography>
                  )}
                </FormControl>
              )}
            />

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">{t.pfx_id_section}</Typography>

            <Box>
              <Typography variant="subtitle1">{t.pfx_custom_name}</Typography>
              <TextField
                fullWidth placeholder="certificado_completo_2024"
                {...register('custom_name', {
                  required: t.pfx_name_required,
                  pattern: { value: /^[a-zA-Z0-9_-]+$/, message: t.pfx_name_pattern },
                })}
                error={!!errors.custom_name} helperText={errors.custom_name?.message}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1">{t.description}</Typography>
              <TextField fullWidth multiline rows={3} placeholder={t.pfx_desc_placeholder} {...register('description')} />
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">{t.tags}</Typography>
                <Tooltip title={t.pfx_tag_hint}>
                  <IconButton size="small"><Info fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth size="small" placeholder={t.pfx_tag_placeholder} value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                />
                <Button variant="outlined" size="small" onClick={handleAddTag} disabled={!tagInput.trim()}>
                  {t.add}
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {tags.map((tag) => (
                  <Chip key={tag} label={tag} onDelete={() => setTags(tags.filter(tg => tg !== tag))} color="primary" size="small" />
                ))}
              </Stack>
            </Box>

            <Button
              type="submit" variant="contained" size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <FolderZip />}
              disabled={loading} fullWidth
            >
              {loading ? t.pfx_generating : t.pfx_generate_btn}
            </Button>
          </Stack>
        </Box>

        {generatedPFX && (
          <>
            <Alert severity="success" sx={{ mt: 3 }}
              action={
                <Button color="inherit" size="small" startIcon={<Download />} onClick={handleDownload}>
                  {t.pfx_dl_btn}
                </Button>
              }
            >
              <Typography variant="subtitle2" gutterBottom>{t.pfx_success_msg}</Typography>
              <Typography variant="body2">{t.name}: <strong>{generatedPFX.custom_name}</strong></Typography>
            </Alert>

            <Card sx={{ mt: 2, bgcolor: 'warning.dark' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.contrastText">
                  <VpnKey sx={{ verticalAlign: 'middle', mr: 1 }} />
                  {t.pfx_pwd_title}
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>{t.pfx_pwd_warning}</strong>
                </Alert>
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField fullWidth value={pfxPassword} InputProps={{ readOnly: true, style: { fontFamily: 'monospace' } }} />
                  <Tooltip title={passwordCopied ? t.pfx_pwd_copied : t.pfx_pwd_copy}>
                    <IconButton onClick={copyPassword} color={passwordCopied ? 'success' : 'primary'}>
                      {passwordCopied ? <CheckCircle /> : <ContentCopy />}
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {t.pfx_pwd_length}
                </Typography>
              </CardContent>
            </Card>
          </>
        )}
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
          {t.pfx_info_title}
        </Typography>
        <Typography variant="body2" paragraph>{t.pfx_info_desc}</Typography>
        <ul>
          <li><Typography variant="body2">{t.pfx_contains_cert}</Typography></li>
          <li><Typography variant="body2">{t.pfx_contains_key}</Typography></li>
          <li><Typography variant="body2">{t.pfx_contains_chain}</Typography></li>
        </ul>
        <Typography variant="body2" paragraph sx={{ mt: 2 }}>{t.pfx_usage_desc}</Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom color="primary">
          <CheckCircle sx={{ verticalAlign: 'middle', mr: 1, fontSize: 20 }} />
          {t.pfx_how_title}
        </Typography>
        <Typography variant="body2" paragraph>{t.pfx_how_desc}</Typography>
        <ul>
          <li><Typography variant="body2"><strong>Export</strong> — {t.pfx_how_export}</Typography></li>
          <li><Typography variant="body2"><strong>Import</strong> — {t.pfx_how_import}</Typography></li>
          <li><Typography variant="body2"><strong>Validate</strong> — {t.pfx_how_validate}</Typography></li>
        </ul>

        <Alert severity="info" sx={{ mt: 2 }}>
          {t.pfx_self_signed_note}
        </Alert>
      </Paper>
    </Box>
  );
};

export default GeneratePFX;
