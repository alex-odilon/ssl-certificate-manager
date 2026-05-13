import React from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Divider,
  Chip, List, ListItem, ListItemIcon, ListItemText, Button,
} from '@mui/material';
import {
  Security, Architecture, Code, Settings, ArrowBack, VerifiedUser,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const AppCertsDocumentation: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/app-certificates')} variant="outlined">
          {t.acd_back_btn}
        </Button>
        <Typography variant="h4" component="h1">{t.acd_title}</Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>{t.acd_subtitle}</Typography>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security /> {t.acd_mtls_title}
        </Typography>
        <Typography variant="body1" paragraph>
          In traditional TLS (like when you access a website), only the <strong>server</strong> presents a certificate to prove its identity. The client (your browser) does not identify itself.
        </Typography>
        <Typography variant="body1" paragraph>
          In <strong>Mutual TLS (mTLS)</strong>, authentication is bilateral:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon><VerifiedUser color="primary" /></ListItemIcon>
            <ListItemText primary="The Server proves who it is" secondary="By sending its public TLS certificate to the client." />
          </ListItem>
          <ListItem>
            <ListItemIcon><VerifiedUser color="success" /></ListItemIcon>
            <ListItemText primary="The Client proves who it is" secondary="By also sending a certificate (client certificate) to the server during the TLS handshake." />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Architecture /> {t.acd_fields_title}
        </Typography>
        <Typography variant="body1" paragraph>
          When you generate a Self-Signed Certificate in the SSL Manager, you are creating the "Identity" of your application. Here is what to fill in:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Common Name (CN)</Typography>
                <Typography variant="body2" color="text.secondary">
                  The main name of the entity. For applications, use the service DNS (e.g., <code>api.my-company.com</code>) or a unique identifier (e.g., <code>payment-worker-01</code>). The partner server can validate whether the CN matches the expected value.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>SAN (Subject Alternative Name)</Typography>
                <Typography variant="body2" color="text.secondary">
                  Allows a single certificate to be valid for multiple DNS names or IPs. Essential in modern architectures where a microservice responds to multiple names or in Kubernetes clusters (e.g., <code>service.namespace.svc.cluster.local</code>).
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Key Type (RSA vs EC)</Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>RSA:</strong> The most compatible. Use RSA 2048 or 4096 for legacy systems. <br/>
                  <strong>EC (Elliptic Curve):</strong> More secure, modern and lightweight, uses less CPU. Ideal for high-throughput microservices (P-256 or P-384).
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Validity</Typography>
                <Typography variant="body2" color="text.secondary">
                  We recommend short validity periods (90 to 365 days) to force periodic key rotation, increasing security. Remember to create a process to notify the partner before rotating.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings /> {t.acd_nginx_title}
        </Typography>
        <Typography variant="body1" paragraph>
          If you are the SERVER receiving the calls, you need to configure your Ingress/NGINX to require and validate the client certificate, passing the data to the backend via HTTP headers.
        </Typography>
        <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: 13, overflowX: 'auto' }}>
          <pre style={{ margin: 0 }}>
{`server {
    listen 443 ssl;
    server_name api.my-company.com;

    ssl_certificate /path/your-site.crt;
    ssl_certificate_key /path/your-site.key;

    ssl_verify_client on;
    ssl_client_certificate /path/trusted-partners.pem;

    location / {
        proxy_set_header ssl-client-cert $ssl_client_escaped_cert;
        proxy_set_header ssl-client-verify $ssl_client_verify;
        proxy_set_header ssl-client-subject-dn $ssl_client_s_dn;
        proxy_pass http://internal-backend;
    }
}`}
          </pre>
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}>
          In your Node/Java/Python application (the backend), you will read the <code>ssl-client-subject-dn</code> header to know WHO is making the call, since NGINX has already guaranteed (via <code>ssl-client-verify: SUCCESS</code>) that the signature is valid.
        </Typography>
      </Paper>
    </Box>
  );
};

export default AppCertsDocumentation;
