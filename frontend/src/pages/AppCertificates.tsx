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

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Tab Panel ───────────────────────────────────────────────────────────────
const TabPanel: React.FC<{ value: number; index: number; children: React.ReactNode }> = ({
  value, index, children,
}) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────
const AppCertificates: React.FC = () => {
  const [tab, setTab] = useState(0);

  // ── Self-signed state ──
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

  // ── Simple PFX state ──
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
      toast.error('Erro ao carregar arquivos');
    }
  };

  // ── SAN helpers ──
  const addSan = () => {
    const v = sanInput.trim();
    if (v && !sanList.includes(v)) { setSanList([...sanList, v]); setSanInput(''); }
  };

  // ── Generate self-signed cert ──
  const handleGenerateCert = async () => {
    if (!cn || !certName) { toast.error('Preencha pelo menos o Common Name e o Nome do arquivo.'); return; }
    try {
      setGenerating(true);
      const res = await axios.post('/api/app-certs/generate-self-signed', {
        common_name: cn,
        organization: org || undefined,
        organizational_unit: ou || undefined,
        country: country || 'BR',
        state: state || undefined,
        locality: locality || undefined,
        email_address: email || undefined,
        validity_days: validityDays,
        key_type: keyType,
        key_size: keySize,
        san_domains: sanList,
        custom_name: certName,
        description: certDesc || undefined,
      });
      setGeneratedPair(res.data);
      toast.success('Certificado autoassinado gerado com sucesso!');
      loadFiles();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao gerar certificado');
    } finally {
      setGenerating(false);
    }
  };

  // ── Generate simple PFX ──
  const handleGeneratePfx = async () => {
    if (!pfxCertId || !pfxKeyId || !pfxName) {
      toast.error('Selecione o certificado, a chave e defina um nome.'); return;
    }
    try {
      setPfxGenerating(true);
      const res = await axios.post('/api/pfx/generate', {
        certificate_id: pfxCertId,
        private_key_id: pfxKeyId,
        custom_name: pfxName,
        description: pfxDesc || undefined,
        tags: [],
      });
      setGeneratedPfx(res.data);
      toast.success('PFX gerado com sucesso!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao gerar PFX');
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
    } catch { toast.error('Erro ao fazer download'); }
  };

  const copy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copiado!');
    setTimeout(() => setCopied(false), 3000);
  };

  const ecSizes = [{ value: 256, label: 'P-256 (256 bits)' }, { value: 384, label: 'P-384 (384 bits)' }];
  const rsaSizes = [2048, 3072, 4096];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Certificados de Aplicação
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Gere certificados autoassinados e arquivos PFX para autenticação mútua (mTLS) entre sistemas.
      </Typography>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LightbulbOutlined color="warning" /> Como funciona a autenticação server-to-server?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Na comunicação mTLS (mutual TLS), <strong>ambos os lados</strong> se identificam com certificados.
          O fluxo típico entre sua aplicação e um parceiro é:
        </Typography>
        <Grid container spacing={2}>
          {[
            { step: '1', title: 'Gere seu par cert + chave', desc: 'Use a aba "Certificado Autoassinado" abaixo. Defina o Common Name como o identificador da sua aplicação (ex: minha-api.empresa.com).' },
            { step: '2', title: 'Gere o PFX', desc: 'Na aba "Gerar PFX", combine seu certificado e sua chave privada em um único arquivo .pfx protegido por senha.' },
            { step: '3', title: 'Entregue o certificado ao parceiro', desc: 'Exporte apenas o certificado (.pem) e envie ao parceiro. Ele adicionará seu certificado à lista de certificados confiáveis (truststore).' },
            { step: '4', title: 'Configure sua aplicação', desc: 'Use o arquivo PFX (com a senha gerada) na configuração do cliente HTTP da sua aplicação para autenticar as chamadas.' },
          ].map(({ step, title, desc }) => (
            <Grid item xs={12} sm={6} key={step}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Chip label={`Passo ${step}`} color="primary" size="small" />
                    <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">{desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* ── Code examples (collapsed by default) ─────────────────────────── */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <Code color="primary" />
            <Typography fontWeight={600}>Exemplos de código — como usar o PFX na sua aplicação</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Java (HttpClient / Spring)</Typography>
              <Paper sx={{ p: 2, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: 13 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`// Carregue o KeyStore com o arquivo PFX
KeyStore ks = KeyStore.getInstance("PKCS12");
try (FileInputStream fis = new FileInputStream("meu-cert.pfx")) {
    ks.load(fis, "SENHA_DO_PFX".toCharArray());
}

KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
kmf.init(ks, "SENHA_DO_PFX".toCharArray());

SSLContext sslContext = SSLContext.getInstance("TLS");
sslContext.init(kmf.getKeyManagers(), null, null);

// Use no cliente HTTP (ex: OkHttp)
OkHttpClient client = new OkHttpClient.Builder()
    .sslSocketFactory(sslContext.getSocketFactory(), trustManager)
    .build();`}</pre>
              </Paper>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Python (requests / httpx)</Typography>
              <Paper sx={{ p: 2, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: 13 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`import requests

# Converta o PFX para PEM antes (openssl pkcs12 -in meu-cert.pfx -out cert.pem -nodes)
# Ou use a biblioteca python-pkcs12

response = requests.get(
    "https://api.parceiro.com/endpoint",
    cert=("cert.pem", "key.pem"),   # certificado e chave extraídos do PFX
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

// Com axios:
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

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Shield />} iconPosition="start" label="Certificado Autoassinado" />
          <Tab icon={<FolderZip />} iconPosition="start" label="Gerar PFX (cert + chave)" />
        </Tabs>

        {/* ── Tab 0: Self-signed ──────────────────────────────────────────── */}
        <TabPanel value={tab} index={0}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>O que é um certificado autoassinado?</AlertTitle>
            Um certificado autoassinado é emitido e assinado pela própria entidade, sem uma autoridade
            certificadora (CA) pública. É ideal para autenticação mTLS entre sistemas internos ou
            parceiros que confiam explicitamente no seu certificado.
          </Alert>

          <Stack spacing={3}>
            <Typography variant="h6">Identidade do Certificado</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Common Name (CN) *"
                  placeholder="minha-api.empresa.com"
                  value={cn}
                  onChange={e => setCn(e.target.value)}
                  helperText="Identificador principal — geralmente o hostname ou nome da aplicação"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Organização (O)"
                  placeholder="Empresa S.A."
                  value={org}
                  onChange={e => setOrg(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Unidade Organizacional (OU)"
                  placeholder="TI / Integrações"
                  value={ou}
                  onChange={e => setOu(e.target.value)}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="País (C)"
                  placeholder="BR"
                  inputProps={{ maxLength: 2 }}
                  value={country}
                  onChange={e => setCountry(e.target.value.toUpperCase())}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Estado (ST)"
                  placeholder="São Paulo"
                  value={state}
                  onChange={e => setState(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cidade (L)"
                  placeholder="São Paulo"
                  value={locality}
                  onChange={e => setLocality(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="E-mail"
                  type="email"
                  placeholder="ti@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider />
            <Typography variant="h6">Configurações Técnicas</Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Validade</InputLabel>
                  <Select value={validityDays} onChange={e => setValidityDays(Number(e.target.value))} label="Validade">
                    <MenuItem value={90}>90 dias (3 meses)</MenuItem>
                    <MenuItem value={180}>180 dias (6 meses)</MenuItem>
                    <MenuItem value={365}>1 ano</MenuItem>
                    <MenuItem value={730}>2 anos</MenuItem>
                    <MenuItem value={1095}>3 anos</MenuItem>
                    <MenuItem value={1825}>5 anos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Tipo de Chave</Typography>
                  <ToggleButtonGroup
                    value={keyType}
                    exclusive
                    onChange={(_, v) => { if (v) { setKeyType(v); setKeySize(v === 'RSA' ? 2048 : 256); } }}
                    size="small"
                  >
                    <ToggleButton value="RSA">RSA</ToggleButton>
                    <ToggleButton value="EC">EC (Curva Elíptica)</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Tamanho / Curva</InputLabel>
                  <Select value={keySize} onChange={e => setKeySize(Number(e.target.value))} label="Tamanho / Curva">
                    {keyType === 'RSA'
                      ? rsaSizes.map(s => <MenuItem key={s} value={s}>{s} bits</MenuItem>)
                      : ecSizes.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* SANs */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Subject Alternative Names (SAN)
                <Tooltip title="Adicione hostnames ou IPs extras que este certificado deve cobrir. Recomendado para mTLS.">
                  <IconButton size="small" sx={{ ml: 0.5 }}><Info fontSize="small" /></IconButton>
                </Tooltip>
              </Typography>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="api.empresa.com ou 192.168.1.10"
                  value={sanInput}
                  onChange={e => setSanInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSan(); } }}
                />
                <Button variant="outlined" size="small" onClick={addSan} disabled={!sanInput.trim()}>
                  Adicionar
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {sanList.map(s => (
                  <Chip key={s} label={s} size="small" onDelete={() => setSanList(sanList.filter(x => x !== s))} />
                ))}
              </Stack>
            </Box>

            <Divider />
            <Typography variant="h6">Identificação no Sistema</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do arquivo *"
                  placeholder="cert_api_parceiro_2025"
                  value={certName}
                  onChange={e => setCertName(e.target.value)}
                  helperText="Apenas letras, números, _ e -"
                  inputProps={{ pattern: '[a-zA-Z0-9_-]+' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Descrição"
                  placeholder="Certificado de autenticação com parceiro X"
                  value={certDesc}
                  onChange={e => setCertDesc(e.target.value)}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              size="large"
              startIcon={generating ? <CircularProgress size={20} /> : <Shield />}
              disabled={generating || !cn || !certName}
              onClick={handleGenerateCert}
            >
              {generating ? 'Gerando...' : 'Gerar Certificado Autoassinado'}
            </Button>
          </Stack>

          {/* Result */}
          {generatedPair && (
            <Box mt={4}>
              <Alert severity="success" sx={{ mb: 2 }}>
                <AlertTitle>Certificado gerado com sucesso!</AlertTitle>
                O certificado e a chave privada foram salvos na sua biblioteca de arquivos.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Badge color="primary" />
                        <Typography variant="subtitle2">Certificado</Typography>
                        <Chip label={generatedPair.certificate.custom_name} size="small" />
                      </Box>
                      <Tooltip title={copiedCert ? 'Copiado!' : 'Copiar PEM'}>
                        <IconButton size="small" onClick={() => copy(generatedPair.certificate_pem, setCopiedCert)} color={copiedCert ? 'success' : 'default'}>
                          {copiedCert ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      value={generatedPair.certificate_pem}
                      InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 11 } }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Envie este certificado ao parceiro para que ele confie na sua identidade.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <VpnKey color="warning" />
                        <Typography variant="subtitle2">Chave Privada</Typography>
                        <Chip label={generatedPair.private_key.custom_name} size="small" color="warning" />
                      </Box>
                      <Tooltip title={copiedKey ? 'Copiado!' : 'Copiar PEM'}>
                        <IconButton size="small" onClick={() => copy(generatedPair.private_key_pem, setCopiedKey)} color={copiedKey ? 'success' : 'default'}>
                          {copiedKey ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      value={generatedPair.private_key_pem}
                      InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 11 } }}
                    />
                    <Alert severity="warning" sx={{ mt: 1 }} icon={<Security fontSize="small" />}>
                      <Typography variant="caption">
                        <strong>Nunca compartilhe a chave privada.</strong> Apenas o certificado deve ser enviado ao parceiro.
                      </Typography>
                    </Alert>
                  </Paper>
                </Grid>
              </Grid>
              <Alert severity="info" sx={{ mt: 2 }}>
                Próximo passo: vá para a aba <strong>"Gerar PFX"</strong> e combine este certificado com sua chave
                para criar o arquivo PFX que será usado pela sua aplicação.
              </Alert>
            </Box>
          )}
        </TabPanel>

        {/* ── Tab 1: Simple PFX ────────────────────────────────────────────── */}
        <TabPanel value={tab} index={1}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>PFX para autenticação de aplicação (sem CA Bundle)</AlertTitle>
            Neste fluxo você combina <strong>apenas o certificado e a chave privada</strong> em um PFX.
            Isso é o suficiente para mTLS quando o parceiro já cadastrou seu certificado no truststore dele.
            Não é necessário incluir um CA Bundle — diferente do PFX de instalação em servidores web.
          </Alert>

          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Certificado</InputLabel>
              <Select
                value={pfxCertId}
                onChange={e => setPfxCertId(Number(e.target.value))}
                label="Certificado"
              >
                <MenuItem value=""><em>Selecione um certificado</em></MenuItem>
                {certificates.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Badge fontSize="small" />
                      <Box>
                        <Typography variant="body2">{c.custom_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Chave Privada</InputLabel>
              <Select
                value={pfxKeyId}
                onChange={e => setPfxKeyId(Number(e.target.value))}
                label="Chave Privada"
              >
                <MenuItem value=""><em>Selecione uma chave privada</em></MenuItem>
                {privateKeys.map(k => (
                  <MenuItem key={k.id} value={k.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <VpnKey fontSize="small" />
                      <Box>
                        <Typography variant="body2">{k.custom_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(k.created_at).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do arquivo PFX *"
                  placeholder="pfx_api_producao"
                  value={pfxName}
                  onChange={e => setPfxName(e.target.value)}
                  helperText="Apenas letras, números, _ e -"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Descrição"
                  placeholder="PFX para autenticação com parceiro X"
                  value={pfxDesc}
                  onChange={e => setPfxDesc(e.target.value)}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              size="large"
              startIcon={pfxGenerating ? <CircularProgress size={20} /> : <FolderZip />}
              disabled={pfxGenerating || !pfxCertId || !pfxKeyId || !pfxName}
              onClick={handleGeneratePfx}
            >
              {pfxGenerating ? 'Gerando...' : 'Gerar PFX'}
            </Button>
          </Stack>

          {/* PFX result */}
          {generatedPfx && (
            <Box mt={4}>
              <Alert
                severity="success"
                action={
                  <Button color="inherit" size="small" startIcon={<Download />} onClick={downloadPfx}>
                    Download PFX
                  </Button>
                }
              >
                <AlertTitle>PFX gerado: {generatedPfx.custom_name}</AlertTitle>
                Baixe o arquivo e guarde a senha abaixo em local seguro.
              </Alert>
              <Paper sx={{ p: 2, mt: 2, border: '1px solid', borderColor: 'warning.main' }}>
                <Typography variant="subtitle2" gutterBottom color="warning.main">
                  Senha do PFX — exibida apenas uma vez
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    fullWidth
                    value={generatedPfx.password_masked}
                    InputProps={{ readOnly: true, sx: { fontFamily: 'monospace' } }}
                  />
                  <Tooltip title={pfxPwdCopied ? 'Copiado!' : 'Copiar senha'}>
                    <IconButton
                      onClick={() => copy(generatedPfx.password_masked, setPfxPwdCopied)}
                      color={pfxPwdCopied ? 'success' : 'default'}
                    >
                      {pfxPwdCopied ? <CheckCircle /> : <ContentCopy />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Documentation for devs */}
          <Divider sx={{ my: 4 }} />
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="info" /> O que fazer com o PFX?
          </Typography>
          <List dense>
            {[
              'O arquivo .pfx contém o certificado + chave privada em formato PKCS#12.',
              'A senha gerada é aleatória e única — guarde-a no cofre de senhas da equipe.',
              'Configure sua aplicação para usar o .pfx na autenticação mTLS (veja exemplos acima).',
              'Não inclua a chave privada em repositórios de código. Use variáveis de ambiente ou cofres de segredos.',
              'Quando o certificado vencer, gere um novo par e um novo PFX. Notifique o parceiro com antecedência.',
            ].map((item, i) => (
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
