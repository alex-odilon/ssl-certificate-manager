import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
} from '@mui/material';
import {
  VpnKey,
  Description,
  FolderZip,
  Badge,
  Folder,
  TrendingUp,
  Refresh,
  Warning,
  CheckCircle,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLanguage } from '../contexts/LanguageContext';

interface FileStats {
  private_key: number;
  certificate: number;
  ca_bundle: number;
  csr: number;
  pfx: number;
  total: number;
}

interface ExpiringCertificate {
  id: number;
  custom_name: string;
  file_type: string;
  days_until_expiry: number;
  expiry_date: string;
}

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expiringCerts, setExpiringCerts] = useState<ExpiringCertificate[]>([]);
  const [showExpiringDetails, setShowExpiringDetails] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/files/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const loadExpiringCertificates = async () => {
    try {
      const response = await axios.get('/api/certificates/expiring');
      setExpiringCerts(response.data);
    } catch (error) {
      console.error('Erro ao carregar certificados expirando:', error);
    }
  };

  useEffect(() => {
    loadStats();
    loadExpiringCertificates();
  }, []);

  const cards = [
    {
      title: t.dash_keys,
      value: stats?.private_key || 0,
      icon: <VpnKey fontSize="large" />,
      color: '#4caf50',
      path: '/files?tab=1',
    },
    {
      title: t.dash_certs,
      value: stats?.certificate || 0,
      icon: <Badge fontSize="large" />,
      color: '#2196f3',
      path: '/files?tab=2',
    },
    {
      title: t.dash_bundles,
      value: stats?.ca_bundle || 0,
      icon: <Folder fontSize="large" />,
      color: '#ff9800',
      path: '/files?tab=3',
    },
    {
      title: t.dash_csrs,
      value: stats?.csr || 0,
      icon: <Description fontSize="large" />,
      color: '#9c27b0',
      path: '/files?tab=4',
    },
    {
      title: t.dash_pfxs,
      value: stats?.pfx || 0,
      icon: <FolderZip fontSize="large" />,
      color: '#f44336',
      path: '/files?tab=5',
    },
    {
      title: t.dash_total,
      value: stats?.total || 0,
      icon: <TrendingUp fontSize="large" />,
      color: '#00bcd4',
      path: '/files?tab=0',
    },
  ];


  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {t.dashboard_title}
        </Typography>
        <Tooltip title={t.dash_refresh}>
          <IconButton onClick={loadStats} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Certificate Expiry Alert Panel */}
      <Box sx={{ mb: 3 }}>
        {expiringCerts.length === 0 ? (
          <Paper sx={{ p: 2 }}>
            <Alert severity="success" icon={<CheckCircle />}>
              <AlertTitle>{t.dash_ok_title}</AlertTitle>
              {t.dash_ok_msg}
            </Alert>
          </Paper>
        ) : (
          expiringCerts.map((cert) => {
            let severity: "error" | "warning" | "info" = "info";
            let title = "";
            let message = "";
            
            if (cert.days_until_expiry < 0) {
               severity = "error";
               title = t.dash_exp_title;
               message = t.dash_expired_msg.replace('{name}', cert.custom_name);
            } else if (cert.days_until_expiry === 0) {
               severity = "error";
               title = t.dash_today_title;
               message = t.dash_today_msg.replace('{name}', cert.custom_name);
            } else if (cert.days_until_expiry <= 3) {
               severity = "error";
               title = t.dash_crit_title;
               message = t.dash_days_msg.replace('{name}', cert.custom_name).replace('{days}', String(cert.days_until_expiry));
            } else if (cert.days_until_expiry <= 7) {
               severity = "warning";
               title = t.dash_urg_title;
               message = t.dash_days_msg.replace('{name}', cert.custom_name).replace('{days}', String(cert.days_until_expiry));
            } else {
               severity = "warning";
               title = t.dash_warn_title;
               message = t.dash_days_msg.replace('{name}', cert.custom_name).replace('{days}', String(cert.days_until_expiry));
            }

            return (
              <Alert 
                key={cert.id} 
                severity={severity} 
                sx={{ mb: 1.5, cursor: 'pointer', boxShadow: 1 }} 
                onClick={() => navigate('/files')}
              >
                <AlertTitle>{title}</AlertTitle>
                {message}
              </Alert>
            );
          })
        )}
      </Box>

      <Grid container spacing={3} mb={4}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 4,
                },
                background: `linear-gradient(135deg, ${card.color}22 0%, ${card.color}44 100%)`,
                borderTop: `4px solid ${card.color}`,
              }}
              onClick={() => navigate(card.path)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h3" component="div">
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

    </Box>
  );
};

export default Dashboard;