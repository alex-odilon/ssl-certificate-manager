import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  InputAdornment,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Search,
  Download,
  Delete,
  VpnKey,
  Description,
  FolderZip,
  Badge as BadgeIcon,
  Folder,
  MoreVert,
  ContentCopy,
  Visibility,
  Upload,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import UploadDialog from '../components/UploadDialog';

interface FileData {
  id: number;
  filename: string;
  custom_name: string;
  description: string;
  file_type: string;
  tags: string[];
  created_at: string;
  imported_at: string;
}

const Files: React.FC = () => {
  const location = useLocation();
  const [files, setFiles] = useState<FileData[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [pfxPasswords, setPfxPasswords] = useState<Record<number, string>>({});
  const [tabValue, setTabValue] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadFiles();
    
    // Check if should open upload dialog
    const params = new URLSearchParams(location.search);
    if (params.get('upload') === 'true') {
      setUploadDialogOpen(true);
    }
  }, [location]);

  useEffect(() => {
    filterFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, searchTerm, tabValue]);

  const loadFiles = async () => {
    try {
      const response = await axios.get('/api/files/');
      setFiles(response.data);
      
      // Count files by type
      const counts: Record<string, number> = {
        all: response.data.length,
        private_key: 0,
        certificate: 0,
        ca_bundle: 0,
        csr: 0,
        pfx: 0,
      };
      
      response.data.forEach((file: FileData) => {
        counts[file.file_type] = (counts[file.file_type] || 0) + 1;
      });
      
      setFileCounts(counts);
    } catch (error) {
      toast.error('Erro ao carregar arquivos');
    }
  };

  const filterFiles = () => {
    let filtered = files;

    // Filter by tab
    if (tabValue > 0) {
      const types = ['all', 'private_key', 'certificate', 'ca_bundle', 'csr', 'pfx'];
      const selectedType = types[tabValue];
      if (selectedType !== 'all') {
        filtered = filtered.filter(file => file.file_type === selectedType);
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.custom_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredFiles(filtered);
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, file: FileData) => {
    setAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFile(null);
  };

  const handleDownload = async (file: FileData) => {
    try {
      const endpoints: Record<string, string> = {
        private_key: `/api/keys/${file.id}/download`,
        certificate: `/api/certificates/${file.id}/download`,
        ca_bundle: `/api/certificates/${file.id}/download`,
        csr: `/api/csr/${file.id}/download`,
        pfx: `/api/pfx/${file.id}/download`,
      };

      const endpoint = endpoints[file.file_type];
      if (!endpoint) return;

      const response = await axios.get(endpoint, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extensions: Record<string, string> = {
        private_key: '.pem',
        certificate: '.crt',
        ca_bundle: '.pem',
        csr: '.csr',
        pfx: '.pfx',
      };
      
      link.setAttribute('download', `${file.custom_name}${extensions[file.file_type]}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao fazer download');
    }
    handleMenuClose();
  };

  const handleDelete = async (file: FileData) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${file.custom_name}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/files/${file.id}`);
      toast.success('Arquivo excluído com sucesso');
      loadFiles();
    } catch (error) {
      toast.error('Erro ao excluir arquivo');
    }
    handleMenuClose();
  };

  const loadPfxPassword = async (fileId: number) => {
    try {
      const response = await axios.get(`/api/pfx/${fileId}/password`);
      setPfxPasswords({ ...pfxPasswords, [fileId]: response.data.password });
    } catch (error) {
      toast.error('Erro ao carregar senha');
    }
  };

  const copyPassword = (fileId: number) => {
    const password = pfxPasswords[fileId];
    if (password) {
      navigator.clipboard.writeText(password);
      toast.success('Senha copiada!');
    }
  };

  const getFileIcon = (fileType: string) => {
    const icons: Record<string, JSX.Element> = {
      private_key: <VpnKey />,
      certificate: <BadgeIcon />,
      ca_bundle: <Folder />,
      csr: <Description />,
      pfx: <FolderZip />,
    };
    return icons[fileType] || <Folder />;
  };

  const getFileTypeLabel = (fileType: string) => {
    const labels: Record<string, string> = {
      private_key: 'Chave Privada',
      certificate: 'Certificado',
      ca_bundle: 'CA Bundle',
      csr: 'CSR',
      pfx: 'PFX',
    };
    return labels[fileType] || fileType;
  };

  const tabLabels = [
    { label: 'Todos', type: 'all' },
    { label: 'Chaves Privadas', type: 'private_key' },
    { label: 'Certificados', type: 'certificate' },
    { label: 'CA Bundles', type: 'ca_bundle' },
    { label: 'CSRs', type: 'csr' },
    { label: 'PFX', type: 'pfx' },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Meus Arquivos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Upload />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Importar Arquivo
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabLabels.map((tab, index) => (
            <Tab
              key={tab.type}
              label={
                <Badge badgeContent={fileCounts[tab.type] || 0} color="primary">
                  {tab.label}
                </Badge>
              }
            />
          ))}
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nome, descrição ou tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Data de Importação</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFiles
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((file) => (
                <TableRow key={file.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getFileIcon(file.file_type)}
                      <Typography variant="body2">
                        {getFileTypeLabel(file.file_type)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {file.custom_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {file.filename}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }}>
                      {file.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {file.tags?.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {new Date(file.imported_at).toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {file.file_type === 'pfx' && (
                        <>
                          {!pfxPasswords[file.id] ? (
                            <Tooltip title="Ver senha">
                              <IconButton
                                size="small"
                                onClick={() => loadPfxPassword(file.id)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Copiar senha">
                              <IconButton
                                size="small"
                                onClick={() => copyPassword(file.id)}
                              >
                                <ContentCopy />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, file)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredFiles.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página:"
        />
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedFile && handleDownload(selectedFile)}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedFile && handleDelete(selectedFile)}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={() => {
          setUploadDialogOpen(false);
          loadFiles();
        }}
      />
    </Box>
  );
};

export default Files;