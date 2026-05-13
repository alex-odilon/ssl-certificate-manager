import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip,
} from '@mui/material';
import { Download, Delete, LinkOff, FolderShared } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLanguage } from '../contexts/LanguageContext';

interface SharedFile {
  id: number;
  file_id: number;
  owner_id: number;
  shared_with_user_id: number;
  created_at: string;
  owner_email: string;
  shared_with_email: string;
  file: { id: number; custom_name: string; description: string; file_type: string; tags: string[] };
}

const SharedFiles: React.FC = () => {
  const { t, lang } = useLanguage();
  const [tabValue, setTabValue] = useState(0);
  const [sharedWithMe, setSharedWithMe] = useState<SharedFile[]>([]);
  const [sharedByMe, setSharedByMe] = useState<SharedFile[]>([]);
  const [, setLoading] = useState(true);

  const localeStr = lang === 'pt-BR' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';

  const loadShares = async () => {
    try {
      setLoading(true);
      const [resWithMe, resByMe] = await Promise.all([
        axios.get('/api/shares/shared-with-me'),
        axios.get('/api/shares/shared-by-me'),
      ]);
      setSharedWithMe(resWithMe.data);
      setSharedByMe(resByMe.data);
    } catch {
      toast.error(t.sf_err_load);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShares(); }, []);

  const handleDownload = async (share: SharedFile) => {
    try {
      const response = await axios.get(`/api/files/${share.file_id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extensions: Record<string, string> = {
        private_key: '.key', certificate: '.crt', ca_bundle: '.pem', csr: '.csr', pfx: '.pfx',
      };
      link.setAttribute('download', `${share.file.custom_name}${extensions[share.file.file_type] || ''}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t.sf_dl_success);
    } catch {
      toast.error(t.sf_dl_err);
    }
  };

  const handleRemoveFromView = async (fileId: number) => {
    if (!window.confirm(t.sf_remove_confirm)) return;
    try {
      await axios.delete(`/api/shares/shared-with-me/${fileId}`);
      toast.success(t.sf_removed_success);
      loadShares();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.sf_err_remove);
    }
  };

  const handleRevokeShare = async (fileId: number, targetUserId: number) => {
    if (!window.confirm(t.sf_revoke_confirm)) return;
    try {
      await axios.delete(`/api/shares/${fileId}/revoke/${targetUserId}`);
      toast.success(t.sf_revoked_success);
      loadShares();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t.sf_err_revoke);
    }
  };

  const renderTable = (shares: SharedFile[], isSharedByMe: boolean) => (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t.sf_col_type}</TableCell>
            <TableCell>{t.sf_col_name}</TableCell>
            <TableCell>{isSharedByMe ? t.sf_col_shared_with : t.sf_col_shared_by}</TableCell>
            <TableCell>{t.sf_col_date}</TableCell>
            <TableCell align="right">{t.sf_col_actions}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {shares.length === 0 ? (
            <TableRow><TableCell colSpan={5} align="center">{t.sf_no_files}</TableCell></TableRow>
          ) : shares.map(share => (
            <TableRow key={share.id} hover>
              <TableCell>
                <Chip size="small" label={share.file.file_type} color="primary" variant="outlined" />
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">{share.file.custom_name}</Typography>
                <Typography variant="caption" color="text.secondary">{share.file.description}</Typography>
              </TableCell>
              <TableCell>{isSharedByMe ? share.shared_with_email : share.owner_email}</TableCell>
              <TableCell>{new Date(share.created_at).toLocaleDateString(localeStr)}</TableCell>
              <TableCell align="right">
                <Box display="flex" gap={1} justifyContent="flex-end">
                  {!isSharedByMe && (
                    <Tooltip title={t.download}>
                      <IconButton size="small" onClick={() => handleDownload(share)}>
                        <Download fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {isSharedByMe ? (
                    <Tooltip title={t.sf_revoke_tip}>
                      <IconButton size="small" color="error" onClick={() => handleRevokeShare(share.file_id, share.shared_with_user_id)}>
                        <LinkOff fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title={t.sf_remove_tip}>
                      <IconButton size="small" color="error" onClick={() => handleRemoveFromView(share.file_id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <FolderShared fontSize="large" color="primary" />
        <Typography variant="h4" component="h1">{t.sf_title}</Typography>
      </Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)} textColor="primary" indicatorColor="primary">
          <Tab label={`${t.sf_tab_with_me} (${sharedWithMe.length})`} />
          <Tab label={`${t.sf_tab_by_me} (${sharedByMe.length})`} />
        </Tabs>
      </Paper>
      {tabValue === 0 && renderTable(sharedWithMe, false)}
      {tabValue === 1 && renderTable(sharedByMe, true)}
    </Box>
  );
};

export default SharedFiles;
