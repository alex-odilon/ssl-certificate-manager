import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Stack, Alert, AlertTitle,
  Divider, Chip, IconButton, Tooltip, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, Grid, Card, CardContent, Accordion,
  AccordionSummary, AccordionDetails, List, ListItem, ListItemIcon,
  ListItemText, Tab, Tabs, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  Shield, FolderZip, Download, ContentCopy, CheckCircle, Info,
  ExpandMore, VpnKey, Badge, Code, LightbulbOutlined, Security,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLanguage } from '../contexts/LanguageContext';

interface FileOption {
  id: number;
  custom_name: string;
  filename: string;
  file_type: string;
  created_at: string;
}

interface GeneratedPair {
  certificate: { id: number; custom_name: string };
  private_key: { id: number; custom_name: string };
  certificate_pem: string;
  private_key_pem: string;
}

interface GeneratedPfx {
  id: number;
  custom_name: string;
  password_masked: string;
}

const TabPanel: React.FC<{ value: number; index: number; children: React.ReactNode }> = ({ value, index, children }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const AppCertificates: React.FC = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState(0);

  const [cn, setCn] = useState('');
  const [org, setOrg] = useState('');
  const [ou, setOu] = useState('');
  const [country, setCountry] = useState('BR');
  const [state, setState] = useState('');
  const [locality, setLocality] = useState('');
  const [email, setEmail] = useState('');
  const [validityDays, setValidityDays] = useState(365);
  const [keyType, setKeyType] = useState('RSA');
  const [keySize, setKeySize] = useState(2048);
  const [sanInput, setSanInput] = useState('');
  const [sanList, setSanList] = useState<string[]>([]);
  const [certName, setCertName] = useState('');
  const [certDesc, setCertDesc] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedPair, setGeneratedPair] = useState<GeneratedPair | null>(null);
  const [copiedCert, setCopiedCert] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const [certificates, setCertificates] = useState<FileOption[]>([]);
  const [privateKeys, setPrivateKeys] = useState<FileOption[]>([]);
  const [pfxCertId, setPfxCertId] = useState<number | ''>('');
  const [pfxKeyId, setPfxKeyId] = useState<number | ''>('');
  const [pfxName, setPfxName] = useState('');
  const [pfxDesc, setPfxDesc] = useState('');
  const [pfxGenerating, setPfxGenerating] = useState(false);
  const [generatedPfx, setGeneratedPfx] = useState<GeneratedPfx | null>(null);
  const [pfxPwdCopied, setPfxPwdCopied] = useState(false);

  useEffect(() => { loadFiles(); }, []);

  const loadFiles = async () => {
    try {
      const [certsRes, keysRes] = await Promise.all([
        axios.get('/api/certificates/'),
        axios.get('/api/keys/'),
      ]);
      setCertificates(certsRes.data.filter((f: any) => f.file_type === 'certificate'));
      setPrivateKeys(keysRes.data);
    } catch {
      toast.error(t.ac_err_load);
    }
  };

  const addSan = () => {
    const v = sanInput.trim();
    if (v && !sanList.includes(v)) { setSanList([...sanList, v]); setSanInput(''); }
  };

  const handleGenerateCert = async () => {
    if (!cn || !certName) { toast.error(t.ac_fill_required); return; }
    try {
      setGenerating(true);
      const res = await axios.post('/api/app-certs/generate-self-signed', {
        common_name: cn, organization: org || undefined, organizational_unit: ou || undefined,
        country: country || 'BR', state: state || undefined, locality: locality || undefined,
        email_address: email || undefined, validity_days: validityDays, key_type: keyType,
        key_size: keySize, san_domains: sanList, custom_name: certName, description: certDesc || undefined,
      });
      setGeneratedPair(res.data);
      toast.success(t.ac_success_cert);
      loadFiles();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.ac_err_cert);
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePfx = async () => {
    if (!pfxCertId || !pfxKeyId || !pfxName) { toast.error(t.ac_fill_pfx_required); return; }
    try {
      setPfxGenerating(true);
      const res = await axios.post('/api/pfx/generate', {
        certificate_id: pfxCertId, private_key_id: pfxKeyId,
        custom_name: pfxName, description: pfxDesc || undefined, tags: [],
      });
      setGeneratedPfx(res.data);
      toast.success(t.ac_success_pfx);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.ac_err_pfx);
    } finally {
      setPfxGenerating(false);
    }
  };

  const downloadPfx = async () => {
    if (!generatedPfx) return;
    try {
      const res = await axios.get(`/api/pfx/${generatedPfx.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `${generatedPfx.custom_name}.pfx`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch { toast.error(t.ac_err_dl); }
  };

  const copy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t.ac_copied);
    setTimeout(() => setCopied(false), 3000);
  };

  const ecSizes = [{ value: 256, label: 'P-256 (256 bits)' }, { value: 384, label: 'P-384 (384 bits)' }];
  const rsaSizes = [2048, 3072, 4096];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>{t.ac_title}</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>{t.ac_subtitle}</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LightbulbOutlined color="warning" /> {t.ac_how_title}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>{t.ac_how_desc}</Typography>
        <Grid container spacing={2}>
          {[
            { step: '1', title: t.ac_step1_title, desc: t.ac_step1_desc },
            { step: '2', title: t.ac_step2_title, desc: t.ac_step2_desc },
            { step: '3', title: t.ac_step3_title, desc: t.ac_step3_desc },
            { step: '4', title: t.ac_step4_title, desc: t.ac_step4_desc },
          ].map(({ step, title, desc }) => (
            <Grid item xs={12} sm={6} key={step}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Chip label={`${t.ac_step_label} ${step}`} color="primary" size="small" />
                    <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">{desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button variant="text" color="primary" startIcon={<Info />}
          onClick={() => window.location.href = '/app-certificates/docs'}
        >
          {t.ac_docs_link}
        </Button>
      </Box>

      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <Code color="primary" />
            <Typography fontWeight={600}>{t.ac_code_title}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Java (HttpClient / Spring)</Typography>
              <Paper sx={{ p: 2, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: 13 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`KeyStore ks = KeyStore.getInstance("PKCS12");
try (FileInputStream fis = new FileInputStream("meu-cert.pfx")) {
    ks.load(fis, "SENHA_DO_PFX".toCharArray());
}
KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
kmf.init(ks, "SENHA_DO_PFX".toCharArray());
SSLContext sslContext = SSLContext.getInstance("TLS");
sslContext.init(kmf.getKeyManagers(), null, null);
OkHttpClient client = new OkHttpClient.Builder()
    .sslSocketFactory(sslContext.getSocketFactory(), trustManager)
    .build();`}</pre>
              </Paper>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Python (requests / httpx)</Typography>
              <Paper sx={{ p: 2, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: 13 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`import requests
response = requests.get(
    "https://api.parceiro.com/endpoint",
    cert=("cert.pem", "key.pem"),
    verify=True
)`}</pre>
              </Paper>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Node.js (https / axios)</Typography>
              <Paper sx={{ p: 2, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: 13 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`const https = require('https');
const fs = require('fs');
const agent = new https.Agent({
    pfx: fs.readFileSync('meu-cert.pfx'),
    passphrase: 'SENHA_DO_PFX'
});
const response = await axios.get('https://api.parceiro.com/endpoint', { httpsAgent: agent });`}</pre>
              </Paper>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>C# (.NET / HttpClient)</Typography>
              <Paper sx={{ p: 2, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: 13 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`var cert = new X509Certificate2("meu-cert.pfx", "SENHA_DO_PFX");
var handler = new HttpClientHandler();
handler.ClientCertificates.Add(cert);
var client = new HttpClient(handler);
var response = await client.GetAsync("https://api.parceiro.com/endpoint");`}</pre>
              </Paper>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Paper sx={{ p: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Shield />} iconPosition="start" label={t.ac_tab0} />
          <Tab icon={<FolderZip />} iconPosition="start" label={t.ac_tab1} />
        </Tabs>

        {/* Tab 0: Self-signed */}
        <TabPanel value={tab} index={0}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>{t.ac_what_is_title}</AlertTitle>
            {t.ac_what_is_desc}
          </Alert>

          <Stack spacing={3}>
            <Typography variant="h6">{t.ac_identity_title}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Common Name (CN) *" placeholder="minha-api.empresa.com"
                  value={cn} onChange={e => setCn(e.target.value)} helperText={t.ac_cn_hint} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label={`${t.description} (O)`} placeholder="Empresa S.A."
                  value={org} onChange={e => setOrg(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label={`${t.description} (OU)`} placeholder="TI / Integrações"
                  value={ou} onChange={e => setOu(e.target.value)} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth label="País (C)" placeholder="BR" inputProps={{ maxLength: 2 }}
                  value={country} onChange={e => setCountry(e.target.value.toUpperCase())} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth label="Estado (ST)" placeholder="São Paulo"
                  value={state} onChange={e => setState(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Cidade (L)" placeholder="São Paulo"
                  value={locality} onChange={e => setLocality(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label={t.csr_email_label} type="email" placeholder="ti@empresa.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </Grid>
            </Grid>

            <Divider />
            <Typography variant="h6">{t.ac_tech_title}</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>{t.date}</InputLabel>
                  <Select value={validityDays} onChange={e => setValidityDays(Number(e.target.value))} label={t.date}>
                    <MenuItem value={90}>{t.ac_val_90}</MenuItem>
                    <MenuItem value={180}>{t.ac_val_180}</MenuItem>
                    <MenuItem value={365}>{t.ac_val_1y}</MenuItem>
                    <MenuItem value={730}>{t.ac_val_2y}</MenuItem>
                    <MenuItem value={1095}>{t.ac_val_3y}</MenuItem>
                    <MenuItem value={1825}>{t.ac_val_5y}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>{t.ac_key_type_label}</Typography>
                  <ToggleButtonGroup value={keyType} exclusive
                    onChange={(_, v) => { if (v) { setKeyType(v); setKeySize(v === 'RSA' ? 2048 : 256); } }}
                    size="small"
                  >
                    <ToggleButton value="RSA">RSA</ToggleButton>
                    <ToggleButton value="EC">EC</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>{t.ac_key_size_label}</InputLabel>
                  <Select value={keySize} onChange={e => setKeySize(Number(e.target.value))} label={t.ac_key_size_label}>
                    {keyType === 'RSA'
                      ? rsaSizes.map(s => <MenuItem key={s} value={s}>{s} bits</MenuItem>)
                      : ecSizes.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                {t.ac_san_title}
                <Tooltip title={t.ac_san_hint}>
                  <IconButton size="small" sx={{ ml: 0.5 }}><Info fontSize="small" /></IconButton>
                </Tooltip>
              </Typography>
              <Box display="flex" gap={1} mb={1}>
                <TextField fullWidth size="small" placeholder={t.ac_san_placeholder} value={sanInput}
                  onChange={e => setSanInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSan(); } }}
                />
                <Button variant="outlined" size="small" onClick={addSan} disabled={!sanInput.trim()}>
                  {t.add}
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {sanList.map(s => (
                  <Chip key={s} label={s} size="small" onDelete={() => setSanList(sanList.filter(x => x !== s))} />
                ))}
              </Stack>
            </Box>

            <Divider />
            <Typography variant="h6">{t.ac_sys_title}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label={`${t.name} *`} placeholder="cert_api_parceiro_2025"
                  value={certName} onChange={e => setCertName(e.target.value)}
                  helperText={t.ac_filename_hint} inputProps={{ pattern: '[a-zA-Z0-9_-]+' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label={t.description} placeholder="Certificado de autenticação com parceiro X"
                  value={certDesc} onChange={e => setCertDesc(e.target.value)}
                />
              </Grid>
            </Grid>

            <Button variant="contained" size="large"
              startIcon={generating ? <CircularProgress size={20} /> : <Shield />}
              disabled={generating || !cn || !certName} onClick={handleGenerateCert}
            >
              {generating ? t.ac_generating : t.ac_generate_btn}
            </Button>
          </Stack>

          {generatedPair && (
            <Box mt={4}>
              <Alert severity="success" sx={{ mb: 2 }}>
                <AlertTitle>{t.ac_success_title}</AlertTitle>
                {t.ac_success_desc}
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Badge color="primary" />
                        <Typography variant="subtitle2">{t.ac_cert_title}</Typography>
                        <Chip label={generatedPair.certificate.custom_name} size="small" />
                      </Box>
                      <Tooltip title={copiedCert ? t.ac_cert_copied : t.ac_copy_pem}>
                        <IconButton size="small" onClick={() => copy(generatedPair.certificate_pem, setCopiedCert)} color={copiedCert ? 'success' : 'default'}>
                          {copiedCert ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <TextField fullWidth multiline rows={6} value={generatedPair.certificate_pem}
                      InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 11 } }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {t.ac_cert_send_desc}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <VpnKey color="warning" />
                        <Typography variant="subtitle2">{t.ac_key_title}</Typography>
                        <Chip label={generatedPair.private_key.custom_name} size="small" color="warning" />
                      </Box>
                      <Tooltip title={copiedKey ? t.ac_key_copied : t.ac_copy_pem}>
                        <IconButton size="small" onClick={() => copy(generatedPair.private_key_pem, setCopiedKey)} color={copiedKey ? 'success' : 'default'}>
                          {copiedKey ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <TextField fullWidth multiline rows={6} value={generatedPair.private_key_pem}
                      InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 11 } }}
                    />
                    <Alert severity="warning" sx={{ mt: 1 }} icon={<Security fontSize="small" />}>
                      <Typography variant="caption"><strong>{t.ac_key_warning}</strong></Typography>
                    </Alert>
                  </Paper>
                </Grid>
              </Grid>
              <Alert severity="info" sx={{ mt: 2 }}>{t.ac_next_step}</Alert>
            </Box>
          )}
        </TabPanel>

        {/* Tab 1: Simple PFX */}
        <TabPanel value={tab} index={1}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>{t.ac_pfx_tab_title}</AlertTitle>
            {t.ac_pfx_tab_desc}
          </Alert>

          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>{t.files_type_cert}</InputLabel>
              <Select value={pfxCertId} onChange={e => setPfxCertId(Number(e.target.value))} label={t.files_type_cert}>
                <MenuItem value=""><em>{t.ac_select_cert_placeholder}</em></MenuItem>
                {certificates.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Badge fontSize="small" />
                      <Box>
                        <Typography variant="body2">{c.custom_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(c.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t.files_type_private_key}</InputLabel>
              <Select value={pfxKeyId} onChange={e => setPfxKeyId(Number(e.target.value))} label={t.files_type_private_key}>
                <MenuItem value=""><em>{t.ac_select_key_placeholder}</em></MenuItem>
                {privateKeys.map(k => (
                  <MenuItem key={k.id} value={k.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <VpnKey fontSize="small" />
                      <Box>
                        <Typography variant="body2">{k.custom_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(k.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label={`${t.name} *`} placeholder="pfx_api_producao"
                  value={pfxName} onChange={e => setPfxName(e.target.value)} helperText={t.ac_pfx_name_hint}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label={t.description} placeholder="PFX para autenticação com parceiro X"
                  value={pfxDesc} onChange={e => setPfxDesc(e.target.value)}
                />
              </Grid>
            </Grid>

            <Button variant="contained" size="large"
              startIcon={pfxGenerating ? <CircularProgress size={20} /> : <FolderZip />}
              disabled={pfxGenerating || !pfxCertId || !pfxKeyId || !pfxName}
              onClick={handleGeneratePfx}
            >
              {pfxGenerating ? t.ac_pfx_generating : t.ac_pfx_generate_btn}
            </Button>
          </Stack>

          {generatedPfx && (
            <Box mt={4}>
              <Alert severity="success"
                action={<Button color="inherit" size="small" startIcon={<Download />} onClick={downloadPfx}>{t.download} PFX</Button>}
              >
                <AlertTitle>{t.ac_pfx_success_title}: {generatedPfx.custom_name}</AlertTitle>
              </Alert>
              <Paper sx={{ p: 2, mt: 2, border: '1px solid', borderColor: 'warning.main' }}>
                <Typography variant="subtitle2" gutterBottom color="warning.main">
                  {t.ac_pfx_pwd_title}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField fullWidth value={generatedPfx.password_masked}
                    InputProps={{ readOnly: true, sx: { fontFamily: 'monospace' } }}
                  />
                  <Tooltip title={pfxPwdCopied ? t.ac_pfx_copied : t.files_copy_pwd}>
                    <IconButton onClick={() => copy(generatedPfx.password_masked, setPfxPwdCopied)} color={pfxPwdCopied ? 'success' : 'default'}>
                      {pfxPwdCopied ? <CheckCircle /> : <ContentCopy />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Box>
          )}

          <Divider sx={{ my: 4 }} />
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="info" /> {t.ac_what_todo_title}
          </Typography>
          <List dense>
            {[t.ac_todo_1, t.ac_todo_2, t.ac_todo_3, t.ac_todo_4, t.ac_todo_5].map((item, i) => (
              <ListItem key={i} disablePadding sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <CheckCircle fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={item} />
              </ListItem>
            ))}
          </List>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AppCertificates;
