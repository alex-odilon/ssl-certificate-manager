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
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();
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
      const domainRegex = /^(\*\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (domainRegex.test(domain)) {
        setSanDomains([...sanDomains, domain]);
        setSanInput('');
      } else {
        toast.error(t.csr_invalid_domain);
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
      if (!sanDomains.includes(commonName)) {
        setSanDomains([...sanDomains, commonName]);
      }
    } else if (!checked && commonName && commonName.startsWith('*.')) {
      const baseDomain = commonName.substring(2);
      setValue('common_name', baseDomain);
      setSanDomains(sanDomains.filter(d => d !== baseDomain));
    }
  };

  const onSubmit = async (data: GenerateCSRForm) => {
    try {
      setLoading(true);
      let finalSanList = [...sanDomains];
      if (includeCommonNameInSan && data.common_name && !finalSanList.includes(data.common_name)) {
        finalSanList.unshift(data.common_name);
      }
      if (data.common_name.startsWith('*.')) {
        const baseDomain = data.common_name.substring(2);
        if (!finalSanList.includes(baseDomain)) {
          finalSanList.push(baseDomain);
        }
      }
      const requestData: any = {
        ...data,
        tags: tags,
        san_domains: finalSanList,
        key_type: keyType,
        key_size: keySize,
      };
      if (!requestData.email || requestData.email.trim() === '') {
        delete requestData.email;
      }
      const response = await axios.post('/api/csr/generate', requestData);
      setGeneratedCSR(response.data);
      toast.success(t.csr_success_gen);
      reset();
      setTags([]);
      setSanDomains([]);
      setIsWildcard(false);
      setIncludeCommonNameInSan(true);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t.csr_err_gen);
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
      toast.success(t.csr_success_dl);
    } catch (error) {
      toast.error(t.csr_err_dl);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>{t.csr_title}</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>{t.csr_subtitle}</Typography>

      <Paper sx={{ p: 4, mt: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Typography variant="h6">{t.csr_cert_info_title}</Typography>

            {/* Key Type + Size */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">{t.csr_key_type_label}</Typography>
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

            <Divider />

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">Common Name (CN)</Typography>
                <Tooltip title={t.ac_cn_hint}>
                  <IconButton size="small"><Info fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                placeholder="exemplo.com.br"
                {...register('common_name', {
                  required: t.csr_cn_required,
                  pattern: {
                    value: /^(\*\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: t.csr_invalid_domain,
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
                    <Typography variant="body2">{t.csr_wildcard_label}</Typography>
                  </Box>
                }
                sx={{ mt: 1 }}
              />
            </Box>

            {/* SAN section */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">{t.csr_san_label}</Typography>
                <Tooltip title={t.ac_san_hint}>
                  <IconButton size="small"><Info fontSize="small" /></IconButton>
                </Tooltip>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>SAN (Subject Alternative Names)</strong> — {t.csr_san_include_cn}
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
                label={t.csr_san_include_cn}
                sx={{ mb: 2 }}
              />

              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t.csr_san_placeholder}
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
                  {t.add}
                </Button>
              </Box>

              {(sanDomains.length > 0 || (includeCommonNameInSan && commonName)) && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List dense>
                    {includeCommonNameInSan && commonName && (
                      <ListItem>
                        <ListItemText
                          primary={commonName}
                          secondary="Common Name (Principal)"
                        />
                        <Chip label="CN" size="small" color="primary" sx={{ ml: 1 }} />
                      </ListItem>
                    )}
                    {commonName && commonName.startsWith('*.') && !sanDomains.includes(commonName.substring(2)) && (
                      <ListItem>
                        <ListItemText
                          primary={commonName.substring(2)}
                          secondary="Base domain (auto)"
                        />
                        <Chip label="Auto" size="small" color="secondary" sx={{ ml: 1 }} />
                      </ListItem>
                    )}
                    {sanDomains.map((domain, index) => (
                      <ListItem key={domain}>
                        <ListItemText
                          primary={domain}
                          secondary={`DNS.${includeCommonNameInSan ? index + 2 : index + 1}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" size="small" onClick={() => handleDeleteSanDomain(domain)}>
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
                <Typography variant="subtitle1">{t.csr_country_label}</Typography>
                <Tooltip title="Código do país com 2 letras (ex: BR para Brasil)">
                  <IconButton size="small"><Info fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                placeholder="BR"
                {...register('country', {
                  required: t.csr_country_required,
                  pattern: {
                    value: /^[A-Z]{2}$/,
                    message: 'Use 2-letter country code',
                  },
                })}
                error={!!errors.country}
                helperText={errors.country?.message}
                inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1">{t.csr_state_label}</Typography>
              <TextField
                fullWidth
                placeholder="São Paulo"
                {...register('state', { required: t.csr_state_required })}
                error={!!errors.state}
                helperText={errors.state?.message}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1">{t.csr_locality_label}</Typography>
              <TextField
                fullWidth
                placeholder="São Paulo"
                {...register('locality', { required: t.csr_locality_required })}
                error={!!errors.locality}
                helperText={errors.locality?.message}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1">{t.csr_org_label}</Typography>
              <TextField
                fullWidth
                placeholder="Minha Empresa LTDA"
                {...register('organization', { required: t.csr_org_required })}
                error={!!errors.organization}
                helperText={errors.organization?.message}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1">{t.csr_ou_label}</Typography>
              <TextField
                fullWidth
                placeholder="TI"
                {...register('organizational_unit', { required: t.csr_org_required })}
                error={!!errors.organizational_unit}
                helperText={errors.organizational_unit?.message}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1">{t.csr_email_label}</Typography>
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

            <Typography variant="h6">{t.csr_file_id_title}</Typography>

            <Box>
              <Typography variant="subtitle1">{t.csr_custom_name_label}</Typography>
              <TextField
                fullWidth
                placeholder="csr_principal_2024"
                {...register('custom_name', {
                  required: t.csr_custom_name_required,
                  pattern: {
                    value: /^[a-zA-Z0-9_-]+$/,
                    message: t.csr_name_pattern,
                  },
                })}
                error={!!errors.custom_name}
                helperText={errors.custom_name?.message}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1">{t.csr_desc_label}</Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder={t.csr_desc_label}
                {...register('description')}
              />
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">{t.tags}</Typography>
              </Box>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t.csr_tag_placeholder}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
                  }}
                />
                <Button variant="outlined" size="small" onClick={handleAddTag} disabled={!tagInput.trim()}>
                  {t.add}
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {tags.map((tag) => (
                  <Chip key={tag} label={tag} onDelete={() => handleDeleteTag(tag)} color="primary" size="small" />
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
              {loading ? t.csr_generating : t.csr_generate_btn}
            </Button>
          </Stack>
        </Box>

        {generatedCSR && (
          <Alert
            severity="success"
            sx={{ mt: 3 }}
            action={
              <Button color="inherit" size="small" startIcon={<Download />} onClick={handleDownload}>
                {t.download} CSR
              </Button>
            }
          >
            <Typography variant="subtitle2" gutterBottom>{t.csr_success_title}</Typography>
            <Typography variant="body2">{t.name}: <strong>{generatedCSR.custom_name}</strong></Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>{t.csr_key_generated}</Typography>
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
          {t.csr_info_section}
        </Typography>
        <Typography variant="body2" paragraph>
          SAN (Subject Alternative Names) allows a single certificate to be valid for multiple domains and subdomains.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>{t.ac_san_hint}</strong>
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default GenerateCSR;
