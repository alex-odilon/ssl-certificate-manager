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
} from '@mui/material';
import {
  VpnKey,
  Description,
  FolderZip,
  Badge,
  Folder,
  TrendingUp,
  Refresh,
  Upload,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

interface FileStats {
  private_key: number;
  certificate: number;
  ca_bundle: number;
  csr: number;
  pfx: number;
  total: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadStats();
  }, []);

  const cards = [
    {
      title: 'Chaves Privadas',
      value: stats?.private_key || 0,
      icon: <VpnKey fontSize="large" />,
      color: '#4caf50',
      path: '/files?type=private_key',
    },
    {
      title: 'Certificados',
      value: stats?.certificate || 0,
      icon: <Badge fontSize="large" />,
      color: '#2196f3',
      path: '/files?type=certificate',
    },
    {
      title: 'CA Bundles',
      value: stats?.ca_bundle || 0,
      icon: <Folder fontSize="large" />,
      color: '#ff9800',
      path: '/files?type=ca_bundle',
    },
    {
      title: 'CSRs',
      value: stats?.csr || 0,
      icon: <Description fontSize="large" />,
      color: '#9c27b0',
      path: '/files?type=csr',
    },
    {
      title: 'Arquivos PFX',
      value: stats?.pfx || 0,
      icon: <FolderZip fontSize="large" />,
      color: '#f44336',
      path: '/files?type=pfx',
    },
    {
      title: 'Total de Arquivos',
      value: stats?.total || 0,
      icon: <TrendingUp fontSize="large" />,
      color: '#00bcd4',
      path: '/files',
    },
  ];

  const quickActions = [
    {
      title: 'Importar Certificado/Chave',
      description: 'Importe certificados, CA bundles ou chaves privadas',
      icon: <Upload />,
      path: '/files?upload=true',
    },
    {
      title: 'Gerar Nova Chave Privada',
      description: 'Crie uma nova chave privada RSA 2048 bits',
      icon: <VpnKey />,
      path: '/generate-key',
    },
    {
      title: 'Gerar CSR',
      description: 'Crie uma solicitação de assinatura de certificado',
      icon: <Description />,
      path: '/generate-csr',
    },
    {
      title: 'Gerar PFX',
      description: 'Combine certificado, chave e CA em um arquivo PFX',
      icon: <FolderZip />,
      path: '/generate-pfx',
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Tooltip title="Atualizar estatísticas">
          <IconButton onClick={loadStats} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

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

      <Typography variant="h5" component="h2" gutterBottom>
        Ações Rápidas
      </Typography>
      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => navigate(action.path)}
            >
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    mr: 2,
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="h6">{action.title}</Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {action.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;