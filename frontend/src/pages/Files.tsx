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
  Share,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import UploadDialog from '../components/UploadDialog';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();
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
  const [expiringMap, setExpiringMap] = useState<Record<number, any>>({});
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadFiles();
    
    // Check URL parameters
    const params = new URLSearchParams(location.search);
    
    // Check if should open upload dialog
    if (params.get('upload') === 'true') {
      setUploadDialogOpen(true);
    }
    
    // Check if should change tab
    const tab = params.get('tab');
    if (tab) {
      setTabValue(parseInt(tab));
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

      try {
        const expResponse = await axios.get('/api/certificates/expiring');
        const map: Record<number, any> = {};
        expResponse.data.forEach((cert: any) => {
          map[cert.id] = cert;
        });
        setExpiringMap(map);
      } catch (err) {
        console.error('Erro ao carregar expirações:', err);
      }
    } catch (error) {
      toast.error(t.files_load_err);
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
      
      toast.success(t.files_downloading);
    } catch (error) {
      toast.error(t.files_dl_err);
    }
    handleMenuClose();
  };

  const handleDelete = async (file: FileData) => {
    if (!window.confirm(`${t.files_del_confirm} "${file.custom_name}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await axios.delete(`/api/files/${file.id}`);
      toast.success(t.files_del_success);
      loadFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t.files_del_err);
    }
    handleMenuClose();
  };

  const handleShare = async () => {
    if (!selectedFile || !shareEmail) return;
    try {
      setSharing(true);
      await axios.post('/api/shares/', { file_id: selectedFile.id, target_email: shareEmail });
      toast.success(t.files_share_success);
      setShareDialogOpen(false);
      setShareEmail('');
      handleMenuClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.files_share_err);
    } finally {
      setSharing(false);
    }
  };

  const loadPfxPassword = async (fileId: number) => {
    try {
      const response = await axios.get(`/api/pfx/${fileId}/password`);
      setPfxPasswords({ ...pfxPasswords, [fileId]: response.data.password });
    } catch (error) {
      toast.error(t.files_dl_err);
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
      private_key: t.files_type_private_key,
      certificate: t.files_type_cert,
      ca_bundle: t.files_type_ca_bundle,
      csr: t.files_type_csr,
      pfx: t.files_type_pfx,
    };
    return labels[fileType] || fileType;
  };

  const tabLabels = [
    { label: t.files_all, type: 'all' },
    { label: t.dash_keys, type: 'private_key' },
    { label: t.dash_certs, type: 'certificate' },
    { label: t.dash_bundles, type: 'ca_bundle' },
    { label: t.dash_csrs, type: 'csr' },
    { label: t.dash_pfxs, type: 'pfx' },
  ];

  const handleExportCSV = async () => {
    try {
      const response = await axios.get('/api/files/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'meus_arquivos_ssl.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t.files_export_success);
    } catch {
      toast.error(t.files_load_err);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {t.files_title}
        </Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExportCSV}>
            {t.files_export_csv}
          </Button>
          <Button variant="contained" startIcon={<Upload />} onClick={() => setUploadDialogOpen(true)}>
            {t.files_import}
          </Button>
        </Box>
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
          placeholder={t.files_search}
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
              <TableCell>{t.type}</TableCell>
              <TableCell>{t.name}</TableCell>
              <TableCell>{t.description}</TableCell>
              <TableCell>{t.tags}</TableCell>
              <TableCell>{t.files_import_date}</TableCell>
              <TableCell align="right">{t.actions}</TableCell>
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
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {file.custom_name}
                      </Typography>
                      {expiringMap[file.id] && (
                        <Tooltip title={`Vence em ${new Date(expiringMap[file.id].expiry_date).toLocaleDateString()}`}>
                          <Chip 
                            label={
                              expiringMap[file.id].days_until_expiry < 0 ? 'VENCIDO' :
                              expiringMap[file.id].days_until_expiry === 0 ? 'VENCE HOJE' :
                              `${expiringMap[file.id].days_until_expiry} DIAS`
                            } 
                            color={
                              expiringMap[file.id].days_until_expiry <= 3 ? 'error' :
                              expiringMap[file.id].days_until_expiry <= 7 ? 'warning' : 'info'
                            }
                            size="small" 
                            variant={expiringMap[file.id].days_until_expiry > 7 ? 'outlined' : 'filled'}
                          />
                        </Tooltip>
                      )}
                    </Box>
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
          labelRowsPerPage={t.files_rows_per_page}
        />
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedFile && handleDownload(selectedFile)}>
          <ListItemIcon><Download fontSize="small" /></ListItemIcon>
          <ListItemText>{t.download}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setShareDialogOpen(true); }}>
          <ListItemIcon><Share fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>{t.files_share}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedFile && handleDelete(selectedFile)}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>{t.delete}</ListItemText>
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

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t.files_share_title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t.files_share_desc} "{selectedFile?.custom_name}".
          </Typography>
          <TextField
            fullWidth label={t.files_share_email_label} type="email"
            value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)} disabled={sharing}>{t.cancel}</Button>
          <Button onClick={handleShare} variant="contained" disabled={sharing}>
            {sharing ? t.files_sharing : t.files_share_btn}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Files;