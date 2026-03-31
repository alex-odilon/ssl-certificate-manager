import React, { createContext, useContext, useState } from 'react';

export type Language = 'pt-BR' | 'en' | 'es';

export interface Translations {
  // Navigation
  nav_dashboard: string;
  nav_generate_key: string;
  nav_generate_csr: string;
  nav_generate_pfx: string;
  nav_ssh_keys: string;
  nav_app_certs: string;
  nav_files: string;
  nav_validation: string;
  nav_users: string;
  // AppBar
  theme_dark: string;
  theme_light: string;
  toggle_theme: string;
  logout: string;
  change_password: string;
  // Common actions
  save: string;
  cancel: string;
  delete: string;
  download: string;
  upload: string;
  generate: string;
  copy: string;
  search: string;
  add: string;
  edit: string;
  confirm: string;
  // Common labels
  name: string;
  description: string;
  tags: string;
  type: string;
  date: string;
  status: string;
  actions: string;
  loading: string;
  // Dashboard
  dashboard_title: string;
  dashboard_expiry_ok: string;
  dashboard_expiry_warn: string;
  // Files
  files_title: string;
  files_import: string;
  files_export_csv: string;
  // User management
  users_title: string;
  users_create: string;
  users_active: string;
  users_inactive: string;
  users_admin: string;
  users_user: string;
  users_block: string;
  users_unblock: string;
  users_reset_pwd: string;
  users_delete: string;
}

const pt: Translations = {
  nav_dashboard: 'Dashboard',
  nav_generate_key: 'Gerar Chave Privada',
  nav_generate_csr: 'Gerar CSR',
  nav_generate_pfx: 'Gerar PFX',
  nav_ssh_keys: 'Chaves SSH',
  nav_app_certs: 'Certificados de Aplicação',
  nav_files: 'Meus Arquivos',
  nav_validation: 'Validar Arquivos',
  nav_users: 'Gerenciar Usuários',
  theme_dark: 'Modo Escuro',
  theme_light: 'Modo Claro',
  toggle_theme: 'Alternar tema',
  logout: 'Sair',
  change_password: 'Alterar Senha',
  save: 'Salvar',
  cancel: 'Cancelar',
  delete: 'Excluir',
  download: 'Download',
  upload: 'Importar',
  generate: 'Gerar',
  copy: 'Copiar',
  search: 'Buscar',
  add: 'Adicionar',
  edit: 'Editar',
  confirm: 'Confirmar',
  name: 'Nome',
  description: 'Descrição',
  tags: 'Tags',
  type: 'Tipo',
  date: 'Data',
  status: 'Status',
  actions: 'Ações',
  loading: 'Carregando...',
  dashboard_title: 'Dashboard',
  dashboard_expiry_ok: 'Todos os certificados estão dentro do prazo.',
  dashboard_expiry_warn: 'certificado(s) próximo(s) do vencimento.',
  files_title: 'Meus Arquivos',
  files_import: 'Importar Arquivo',
  files_export_csv: 'Exportar CSV',
  users_title: 'Gerenciar Usuários',
  users_create: 'Criar Usuário',
  users_active: 'Ativo',
  users_inactive: 'Inativo',
  users_admin: 'Administrador',
  users_user: 'Usuário',
  users_block: 'Bloquear',
  users_unblock: 'Desbloquear',
  users_reset_pwd: 'Redefinir Senha',
  users_delete: 'Excluir Usuário',
};

const en: Translations = {
  nav_dashboard: 'Dashboard',
  nav_generate_key: 'Generate Private Key',
  nav_generate_csr: 'Generate CSR',
  nav_generate_pfx: 'Generate PFX',
  nav_ssh_keys: 'SSH Keys',
  nav_app_certs: 'App Certificates',
  nav_files: 'My Files',
  nav_validation: 'Validate Files',
  nav_users: 'Manage Users',
  theme_dark: 'Dark Mode',
  theme_light: 'Light Mode',
  toggle_theme: 'Toggle theme',
  logout: 'Sign Out',
  change_password: 'Change Password',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  download: 'Download',
  upload: 'Import',
  generate: 'Generate',
  copy: 'Copy',
  search: 'Search',
  add: 'Add',
  edit: 'Edit',
  confirm: 'Confirm',
  name: 'Name',
  description: 'Description',
  tags: 'Tags',
  type: 'Type',
  date: 'Date',
  status: 'Status',
  actions: 'Actions',
  loading: 'Loading...',
  dashboard_title: 'Dashboard',
  dashboard_expiry_ok: 'All certificates are within their validity period.',
  dashboard_expiry_warn: 'certificate(s) expiring soon.',
  files_title: 'My Files',
  files_import: 'Import File',
  files_export_csv: 'Export CSV',
  users_title: 'User Management',
  users_create: 'Create User',
  users_active: 'Active',
  users_inactive: 'Inactive',
  users_admin: 'Administrator',
  users_user: 'User',
  users_block: 'Block',
  users_unblock: 'Unblock',
  users_reset_pwd: 'Reset Password',
  users_delete: 'Delete User',
};

const es: Translations = {
  nav_dashboard: 'Panel',
  nav_generate_key: 'Generar Clave Privada',
  nav_generate_csr: 'Generar CSR',
  nav_generate_pfx: 'Generar PFX',
  nav_ssh_keys: 'Claves SSH',
  nav_app_certs: 'Certificados de Aplicación',
  nav_files: 'Mis Archivos',
  nav_validation: 'Validar Archivos',
  nav_users: 'Gestionar Usuarios',
  theme_dark: 'Modo Oscuro',
  theme_light: 'Modo Claro',
  toggle_theme: 'Cambiar tema',
  logout: 'Cerrar Sesión',
  change_password: 'Cambiar Contraseña',
  save: 'Guardar',
  cancel: 'Cancelar',
  delete: 'Eliminar',
  download: 'Descargar',
  upload: 'Importar',
  generate: 'Generar',
  copy: 'Copiar',
  search: 'Buscar',
  add: 'Agregar',
  edit: 'Editar',
  confirm: 'Confirmar',
  name: 'Nombre',
  description: 'Descripción',
  tags: 'Etiquetas',
  type: 'Tipo',
  date: 'Fecha',
  status: 'Estado',
  actions: 'Acciones',
  loading: 'Cargando...',
  dashboard_title: 'Panel de Control',
  dashboard_expiry_ok: 'Todos los certificados están dentro del plazo.',
  dashboard_expiry_warn: 'certificado(s) próximos a vencer.',
  files_title: 'Mis Archivos',
  files_import: 'Importar Archivo',
  files_export_csv: 'Exportar CSV',
  users_title: 'Gestión de Usuarios',
  users_create: 'Crear Usuario',
  users_active: 'Activo',
  users_inactive: 'Inactivo',
  users_admin: 'Administrador',
  users_user: 'Usuario',
  users_block: 'Bloquear',
  users_unblock: 'Desbloquear',
  users_reset_pwd: 'Restablecer Contraseña',
  users_delete: 'Eliminar Usuario',
};

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷' },
  { code: 'en',    label: 'English',         flag: '🇺🇸' },
  { code: 'es',    label: 'Español',         flag: '🇪🇸' },
];

const translationsMap: Record<Language, Translations> = { 'pt-BR': pt, en, es };

interface LanguageContextData {
  lang: Language;
  t: Translations;
  setLang: (l: Language) => void;
}

const LanguageContext = createContext<LanguageContextData>({
  lang: 'pt-BR',
  t: pt,
  setLang: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('appLanguage') as Language) || 'pt-BR';
  });

  const setLang = (l: Language) => {
    localStorage.setItem('appLanguage', l);
    setLangState(l);
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translationsMap[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};
