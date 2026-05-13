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
  nav_shared_files: string;
  // AppBar
  app_title: string;
  theme_dark: string;
  theme_light: string;
  toggle_theme: string;
  logout: string;
  change_password: string;
  // Change password dialog (Layout)
  pwd_current: string;
  pwd_new: string;
  pwd_confirm: string;
  pwd_min_chars: string;
  pwd_saving: string;
  pwd_mismatch_err: string;
  pwd_min_err: string;
  pwd_changed: string;
  pwd_change_err: string;
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
  dash_refresh: string;
  dash_keys: string;
  dash_certs: string;
  dash_bundles: string;
  dash_csrs: string;
  dash_pfxs: string;
  dash_total: string;
  dash_ok_title: string;
  dash_ok_msg: string;
  dash_exp_title: string;
  dash_today_title: string;
  dash_crit_title: string;
  dash_urg_title: string;
  dash_warn_title: string;
  dash_expired_msg: string;
  dash_today_msg: string;
  dash_days_msg: string;
  // Files
  files_title: string;
  files_import: string;
  files_export_csv: string;
  files_search: string;
  files_all: string;
  files_import_date: string;
  files_downloading: string;
  files_del_confirm: string;
  files_del_success: string;
  files_copy_pwd: string;
  files_view_pwd: string;
  files_export_success: string;
  files_type_private_key: string;
  files_type_cert: string;
  files_type_ca_bundle: string;
  files_type_csr: string;
  files_type_pfx: string;
  files_rows_per_page: string;
  files_share: string;
  files_share_title: string;
  files_share_email_label: string;
  files_share_desc: string;
  files_sharing: string;
  files_share_btn: string;
  files_share_success: string;
  files_share_err: string;
  files_dl_err: string;
  files_del_err: string;
  files_load_err: string;
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
  um_refresh: string;
  um_stat_total: string;
  um_stat_active: string;
  um_stat_blocked: string;
  um_stat_ssl: string;
  um_col_user: string;
  um_col_email: string;
  um_col_profile: string;
  um_col_last_login: string;
  um_col_created: string;
  um_must_change_pwd: string;
  um_block_access: string;
  um_unblock_access: string;
  um_reset_tip: string;
  um_delete_tip: string;
  um_blocked_chip: string;
  um_create_title: string;
  um_auto_pwd_info: string;
  um_fullname_field: string;
  um_username_field: string;
  um_email_field: string;
  um_role_field: string;
  um_role_user: string;
  um_role_admin: string;
  um_creating: string;
  um_done: string;
  um_created_title: string;
  um_temp_pwd_send: string;
  um_fill_all: string;
  um_pwd_min_8: string;
  um_reset_dialog_title: string;
  um_reset_force_info: string;
  um_new_temp_pwd: string;
  um_min_8_helper: string;
  um_resetting: string;
  um_reset_btn: string;
  um_delete_dialog_title: string;
  um_delete_warning: string;
  um_delete_confirm_msg: string;
  um_deleting: string;
  um_delete_permanent: string;
  um_err_load: string;
  um_err_create: string;
  um_err_update: string;
  um_err_reset: string;
  um_err_delete: string;
  um_blocked_success: string;
  um_unblocked_success: string;
  um_reset_success: string;
  um_delete_success: string;
  // Generate PFX
  pfx_title: string;
  pfx_subtitle: string;
  pfx_select_section: string;
  pfx_cert_required: string;
  pfx_select_cert: string;
  pfx_ca_required: string;
  pfx_select_ca: string;
  pfx_key_required: string;
  pfx_select_key: string;
  pfx_id_section: string;
  pfx_custom_name: string;
  pfx_name_required: string;
  pfx_name_pattern: string;
  pfx_desc_placeholder: string;
  pfx_tag_placeholder: string;
  pfx_tag_hint: string;
  pfx_generating: string;
  pfx_generate_btn: string;
  pfx_success_msg: string;
  pfx_dl_btn: string;
  pfx_pwd_title: string;
  pfx_pwd_warning: string;
  pfx_pwd_copy: string;
  pfx_pwd_copied: string;
  pfx_pwd_length: string;
  pfx_info_title: string;
  pfx_info_desc: string;
  pfx_contains_header: string;
  pfx_contains_cert: string;
  pfx_contains_key: string;
  pfx_contains_chain: string;
  pfx_usage_desc: string;
  pfx_how_title: string;
  pfx_how_desc: string;
  pfx_how_export: string;
  pfx_how_import: string;
  pfx_how_validate: string;
  pfx_self_signed_note: string;
  pfx_err_load: string;
  pfx_err_gen: string;
  pfx_err_dl: string;
  pfx_success_gen: string;
  pfx_success_dl: string;
  // App Certificates
  ac_title: string;
  ac_subtitle: string;
  ac_how_title: string;
  ac_how_desc: string;
  ac_step1_title: string;
  ac_step1_desc: string;
  ac_step2_title: string;
  ac_step2_desc: string;
  ac_step3_title: string;
  ac_step3_desc: string;
  ac_step4_title: string;
  ac_step4_desc: string;
  ac_step_label: string;
  ac_docs_link: string;
  ac_code_title: string;
  ac_tab0: string;
  ac_tab1: string;
  ac_what_is_title: string;
  ac_what_is_desc: string;
  ac_identity_title: string;
  ac_cn_hint: string;
  ac_tech_title: string;
  ac_val_90: string;
  ac_val_180: string;
  ac_val_1y: string;
  ac_val_2y: string;
  ac_val_3y: string;
  ac_val_5y: string;
  ac_key_type_label: string;
  ac_key_size_label: string;
  ac_san_title: string;
  ac_san_hint: string;
  ac_san_placeholder: string;
  ac_sys_title: string;
  ac_filename_hint: string;
  ac_generating: string;
  ac_generate_btn: string;
  ac_success_title: string;
  ac_success_desc: string;
  ac_cert_title: string;
  ac_copy_pem: string;
  ac_cert_copied: string;
  ac_key_copied: string;
  ac_cert_send_desc: string;
  ac_key_title: string;
  ac_key_warning: string;
  ac_next_step: string;
  ac_pfx_tab_title: string;
  ac_pfx_tab_desc: string;
  ac_select_cert_placeholder: string;
  ac_select_key_placeholder: string;
  ac_pfx_name_hint: string;
  ac_pfx_generating: string;
  ac_pfx_generate_btn: string;
  ac_pfx_success_title: string;
  ac_pfx_pwd_title: string;
  ac_pfx_copied: string;
  ac_what_todo_title: string;
  ac_todo_1: string;
  ac_todo_2: string;
  ac_todo_3: string;
  ac_todo_4: string;
  ac_todo_5: string;
  ac_err_load: string;
  ac_err_cert: string;
  ac_err_pfx: string;
  ac_err_dl: string;
  ac_success_cert: string;
  ac_success_pfx: string;
  ac_copied: string;
  ac_fill_required: string;
  ac_fill_pfx_required: string;
  // Shared Files
  sf_title: string;
  sf_tab_with_me: string;
  sf_tab_by_me: string;
  sf_col_type: string;
  sf_col_name: string;
  sf_col_shared_with: string;
  sf_col_shared_by: string;
  sf_col_date: string;
  sf_col_actions: string;
  sf_no_files: string;
  sf_dl_success: string;
  sf_dl_err: string;
  sf_remove_confirm: string;
  sf_removed_success: string;
  sf_err_remove: string;
  sf_revoke_confirm: string;
  sf_revoked_success: string;
  sf_err_revoke: string;
  sf_revoke_tip: string;
  sf_remove_tip: string;
  sf_err_load: string;
  // Generate Key
  gk_title: string;
  gk_subtitle: string;
  gk_key_type_title: string;
  gk_key_type_hint: string;
  gk_key_size_rsa: string;
  gk_key_size_ec: string;
  gk_default: string;
  gk_high_security: string;
  gk_custom_name_title: string;
  gk_custom_name_hint: string;
  gk_custom_name_required: string;
  gk_name_pattern: string;
  gk_desc_title: string;
  gk_desc_hint: string;
  gk_tags_hint: string;
  gk_tag_placeholder: string;
  gk_generating: string;
  gk_generate_btn: string;
  gk_success_title: string;
  gk_success_type: string;
  gk_success_size: string;
  gk_success_important: string;
  gk_info_title: string;
  gk_info_desc: string;
  gk_info_li1: string;
  gk_info_li2: string;
  gk_info_li3: string;
  gk_security_warning: string;
  gk_import_title: string;
  gk_import_desc: string;
  gk_import_note: string;
  gk_err_gen: string;
  gk_success_gen: string;
  gk_success_dl: string;
  gk_err_dl: string;
  // Force Password Change
  fp_title: string;
  fp_first_access: string;
  fp_first_access_desc: string;
  fp_security_title: string;
  fp_tip1: string;
  fp_tip2: string;
  fp_tip3: string;
  fp_tip4: string;
  fp_tip5: string;
  fp_tip6: string;
  fp_current_pwd: string;
  fp_new_pwd: string;
  fp_confirm_pwd: string;
  fp_strength: string;
  fp_weak: string;
  fp_fair: string;
  fp_good: string;
  fp_strong: string;
  fp_mismatch: string;
  fp_fill_all: string;
  fp_mismatch_err: string;
  fp_min_8: string;
  fp_too_weak: string;
  fp_changing: string;
  fp_set_btn: string;
  fp_success: string;
  fp_err: string;
  // Generate CSR
  csr_title: string;
  csr_subtitle: string;
  csr_cn_label: string;
  csr_cn_required: string;
  csr_country_label: string;
  csr_country_required: string;
  csr_state_label: string;
  csr_state_required: string;
  csr_locality_label: string;
  csr_locality_required: string;
  csr_org_label: string;
  csr_org_required: string;
  csr_ou_label: string;
  csr_email_label: string;
  csr_wildcard_label: string;
  csr_wildcard_hint: string;
  csr_san_label: string;
  csr_san_placeholder: string;
  csr_san_include_cn: string;
  csr_key_type_label: string;
  csr_key_size_label: string;
  csr_custom_name_label: string;
  csr_custom_name_required: string;
  csr_name_pattern: string;
  csr_desc_label: string;
  csr_tag_placeholder: string;
  csr_generating: string;
  csr_generate_btn: string;
  csr_success_title: string;
  csr_copy_csr: string;
  csr_csr_copied: string;
  csr_key_generated: string;
  csr_key_label: string;
  csr_info_section: string;
  csr_err_gen: string;
  csr_success_gen: string;
  csr_err_dl: string;
  csr_success_dl: string;
  // Generate SSH Key
  ssh_title: string;
  ssh_subtitle: string;
  ssh_key_name_label: string;
  ssh_key_name_required: string;
  ssh_key_type_label: string;
  ssh_key_size_label: string;
  ssh_comment_label: string;
  ssh_generating: string;
  ssh_generate_btn: string;
  ssh_success_title: string;
  ssh_pub_key_label: string;
  ssh_priv_key_label: string;
  ssh_copy_pub: string;
  ssh_copy_priv: string;
  ssh_pub_copied: string;
  ssh_priv_copied: string;
  ssh_download_pub: string;
  ssh_download_priv: string;
  ssh_warning: string;
  ssh_err_gen: string;
  ssh_err_load: string;
  ssh_delete_confirm: string;
  ssh_delete_success: string;
  ssh_err_delete: string;
  // Validation
  val_title: string;
  val_subtitle: string;
  val_mode_upload: string;
  val_mode_existing: string;
  val_upload_hint: string;
  val_file_type_label: string;
  val_file_all: string;
  val_pfx_pwd_label: string;
  val_validate_btn: string;
  val_validating: string;
  val_result_title: string;
  val_valid: string;
  val_invalid: string;
  val_cert_details: string;
  val_err_load: string;
  val_err_validate: string;
  val_no_file: string;
  val_cert_match: string;
  val_cert_no_match: string;
  // Forgot Password
  forgot_title: string;
  forgot_subtitle: string;
  forgot_email_label: string;
  forgot_send_btn: string;
  forgot_sending: string;
  forgot_success: string;
  forgot_back_login: string;
  forgot_err: string;
  // Upload Dialog
  upload_title: string;
  upload_drop_hint: string;
  upload_select_type: string;
  upload_type_required: string;
  upload_custom_name: string;
  upload_custom_name_required: string;
  upload_name_pattern: string;
  upload_desc: string;
  upload_tag_placeholder: string;
  upload_uploading: string;
  upload_btn: string;
  upload_success: string;
  upload_err: string;
  upload_no_file: string;
  // App Certs Documentation
  acd_title: string;
  acd_subtitle: string;
  acd_back_btn: string;
  acd_mtls_title: string;
  acd_fields_title: string;
  acd_nginx_title: string;
  // ForgotPassword additional
  forgot_step1: string;
  forgot_step2: string;
  forgot_step3: string;
  forgot_username_label: string;
  forgot_checking: string;
  forgot_continue: string;
  forgot_security_answer_label: string;
  forgot_answer_helper: string;
  forgot_changing: string;
  forgot_change_btn: string;
  forgot_user_not_found: string;
  forgot_wrong_answer: string;
  forgot_reset_err: string;
  // Change Password Dialog
  cpd_min_err: string;
  cpd_min_chars: string;
  cpd_changing: string;
  cpd_change_btn: string;
  // SSH additional
  ssh_passphrase_title: string;
  ssh_passphrase_on: string;
  ssh_passphrase_off: string;
  ssh_no_passphrase_alert_title: string;
  ssh_no_passphrase_alert_desc: string;
  ssh_confirm_passphrase_label: string;
  ssh_passphrase_mismatch: string;
  ssh_my_keys_title: string;
  ssh_no_keys_msg: string;
  ssh_col_comment: string;
  ssh_col_passphrase: string;
  ssh_col_created: string;
  ssh_delete_dialog_title: string;
  ssh_delete_irreversible_msg: string;
  ssh_removing: string;
  // CSR additional
  csr_cert_info_title: string;
  csr_file_id_title: string;
  csr_invalid_domain: string;
  // Validation additional
  val_file_selected_prefix: string;
  val_accepted_formats: string;
  val_pfx_loading_pwd: string;
  // Upload additional
  upload_csr_err: string;
  upload_pfx_err: string;
  upload_encrypted_key_err: string;
  // Login
  login_subtitle: string;
  login_username: string;
  login_username_required: string;
  login_password: string;
  login_password_required: string;
  login_sign_in: string;
  login_signing_in: string;
  login_error: string;
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
  nav_shared_files: 'Arquivos Compartilhados',
  app_title: 'Gerenciador de Certificados SSL/TLS',
  theme_dark: 'Modo Escuro',
  theme_light: 'Modo Claro',
  toggle_theme: 'Alternar tema',
  logout: 'Sair',
  change_password: 'Alterar Senha',
  pwd_current: 'Senha Atual',
  pwd_new: 'Nova Senha',
  pwd_confirm: 'Confirmar Nova Senha',
  pwd_min_chars: 'Mínimo 8 caracteres',
  pwd_saving: 'Salvando...',
  pwd_mismatch_err: 'As senhas não coincidem',
  pwd_min_err: 'A nova senha deve ter pelo menos 8 caracteres',
  pwd_changed: 'Senha alterada com sucesso!',
  pwd_change_err: 'Erro ao alterar senha',
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
  dash_refresh: 'Atualizar estatísticas',
  dash_keys: 'Chaves Privadas',
  dash_certs: 'Certificados',
  dash_bundles: 'CA Bundles',
  dash_csrs: 'CSRs',
  dash_pfxs: 'Arquivos PFX',
  dash_total: 'Total de Arquivos',
  dash_ok_title: 'Tudo em ordem!',
  dash_ok_msg: 'Nenhum certificado expirando nos próximos 30 dias.',
  dash_exp_title: 'Certificado Vencido!',
  dash_today_title: 'Vence Hoje!',
  dash_crit_title: 'Risco Crítico de Vencimento',
  dash_urg_title: 'Atenção Urgente',
  dash_warn_title: 'Aviso de Vencimento',
  dash_expired_msg: "O arquivo '{name}' venceu e não é mais válido.",
  dash_today_msg: "O arquivo '{name}' vence hoje!",
  dash_days_msg: "O arquivo '{name}' vence em {days} dia(s).",
  files_title: 'Meus Arquivos',
  files_import: 'Importar Arquivo',
  files_export_csv: 'Exportar CSV',
  files_search: 'Buscar por nome, descrição ou tags...',
  files_all: 'Todos',
  files_import_date: 'Data de Importação',
  files_downloading: 'Download iniciado!',
  files_del_confirm: 'Tem certeza que deseja excluir',
  files_del_success: 'Arquivo excluído com sucesso',
  files_copy_pwd: 'Copiar senha',
  files_view_pwd: 'Ver senha',
  files_export_success: 'CSV exportado com sucesso!',
  files_type_private_key: 'Chave Privada',
  files_type_cert: 'Certificado',
  files_type_ca_bundle: 'CA Bundle',
  files_type_csr: 'CSR',
  files_type_pfx: 'PFX',
  files_rows_per_page: 'Linhas por página:',
  files_share: 'Compartilhar',
  files_share_title: 'Compartilhar Arquivo',
  files_share_email_label: 'E-mail do usuário',
  files_share_desc: 'Digite o e-mail do usuário com quem deseja compartilhar',
  files_sharing: 'Compartilhando...',
  files_share_btn: 'Compartilhar',
  files_share_success: 'Arquivo compartilhado com sucesso!',
  files_share_err: 'Erro ao compartilhar arquivo',
  files_dl_err: 'Erro ao fazer download',
  files_del_err: 'Erro ao excluir arquivo',
  files_load_err: 'Erro ao carregar arquivos',
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
  um_refresh: 'Atualizar',
  um_stat_total: 'Total de Usuários',
  um_stat_active: 'Usuários Ativos',
  um_stat_blocked: 'Usuários Bloqueados',
  um_stat_ssl: 'Arquivos SSL/TLS',
  um_col_user: 'Usuário',
  um_col_email: 'E-mail',
  um_col_profile: 'Perfil',
  um_col_last_login: 'Último Login',
  um_col_created: 'Criado em',
  um_must_change_pwd: 'Deve trocar senha',
  um_block_access: 'Bloquear acesso',
  um_unblock_access: 'Desbloquear acesso',
  um_reset_tip: 'Redefinir senha',
  um_delete_tip: 'Excluir usuário e dados',
  um_blocked_chip: 'Bloqueado',
  um_create_title: 'Criar Novo Usuário',
  um_auto_pwd_info: 'O sistema gerará automaticamente uma senha segura e aleatória. O usuário será obrigado a trocá-la no primeiro acesso.',
  um_fullname_field: 'Nome completo',
  um_username_field: 'Nome de usuário',
  um_email_field: 'E-mail',
  um_role_field: 'Perfil',
  um_role_user: 'Usuário',
  um_role_admin: 'Administrador',
  um_creating: 'Criando...',
  um_done: 'Concluir',
  um_created_title: 'Usuário criado com sucesso!',
  um_temp_pwd_send: 'Envie esta senha temporária para o usuário:',
  um_fill_all: 'Preencha todos os campos.',
  um_pwd_min_8: 'Senha deve ter pelo menos 8 caracteres.',
  um_reset_dialog_title: 'Redefinir Senha',
  um_reset_force_info: 'O usuário será obrigado a trocar a senha no próximo login.',
  um_new_temp_pwd: 'Nova senha temporária',
  um_min_8_helper: 'Mínimo 8 caracteres',
  um_resetting: 'Redefinindo...',
  um_reset_btn: 'Redefinir Senha',
  um_delete_dialog_title: 'Excluir Usuário',
  um_delete_warning: 'Esta ação é irreversível. Todos os arquivos SSL/TLS e chaves SSH do usuário serão removidos permanentemente.',
  um_delete_confirm_msg: 'Confirma a exclusão de',
  um_deleting: 'Removendo...',
  um_delete_permanent: 'Excluir Permanentemente',
  um_err_load: 'Erro ao carregar usuários',
  um_err_create: 'Erro ao criar usuário',
  um_err_update: 'Erro ao atualizar usuário',
  um_err_reset: 'Erro ao redefinir senha',
  um_err_delete: 'Erro ao excluir usuário',
  um_blocked_success: 'bloqueado',
  um_unblocked_success: 'desbloqueado',
  um_reset_success: 'Senha redefinida. O usuário deverá trocar no próximo login.',
  um_delete_success: 'Usuário e todos os seus dados foram removidos.',
  pfx_title: 'Gerar PFX',
  pfx_subtitle: 'Combine certificado, chave privada e CA bundle em um arquivo PFX protegido por senha.',
  pfx_select_section: 'Selecione os Arquivos',
  pfx_cert_required: 'Certificado é obrigatório',
  pfx_select_cert: 'Selecione um certificado',
  pfx_ca_required: 'CA Bundle é obrigatório',
  pfx_select_ca: 'Selecione um CA Bundle',
  pfx_key_required: 'Chave privada é obrigatória',
  pfx_select_key: 'Selecione uma chave privada',
  pfx_id_section: 'Identificação do Arquivo',
  pfx_custom_name: 'Nome Personalizado',
  pfx_name_required: 'Nome é obrigatório',
  pfx_name_pattern: 'Use apenas letras, números, _ e -',
  pfx_desc_placeholder: 'PFX completo para instalação no servidor',
  pfx_tag_placeholder: 'Digite uma tag e pressione Enter',
  pfx_tag_hint: 'Adicione tags para facilitar a busca',
  pfx_generating: 'Gerando...',
  pfx_generate_btn: 'Gerar PFX',
  pfx_success_msg: 'PFX gerado com sucesso!',
  pfx_dl_btn: 'Download PFX',
  pfx_pwd_title: 'Senha do PFX',
  pfx_pwd_warning: 'ATENÇÃO: Esta senha é exibida apenas uma vez! Copie e armazene em local seguro.',
  pfx_pwd_copy: 'Copiar senha',
  pfx_pwd_copied: 'Copiado!',
  pfx_pwd_length: 'Senha: 25 caracteres (letras maiúsculas, minúsculas e números)',
  pfx_info_title: 'O que é um arquivo PFX?',
  pfx_info_desc: 'Um arquivo PFX (também conhecido como PKCS#12) é um formato de arquivo que contém:',
  pfx_contains_header: 'Conteúdo do PFX:',
  pfx_contains_cert: 'O certificado SSL/TLS',
  pfx_contains_key: 'A chave privada correspondente',
  pfx_contains_chain: 'A cadeia de certificados intermediários (CA Bundle)',
  pfx_usage_desc: 'Tudo em um único arquivo protegido por senha, facilitando a instalação em servidores Windows/IIS, Exchange, e outros sistemas.',
  pfx_how_title: 'Como gerar corretamente?',
  pfx_how_desc: 'Para gerar o PFX corretamente, você precisa:',
  pfx_how_export: 'Exportar o Certificado e o CA Bundle fornecidos pela sua Entidade Certificadora externa (GlobalSign, Let\'s Encrypt, DigiCert, etc).',
  pfx_how_import: 'Importar esses arquivos para o SSL Manager através do menu Meus Arquivos.',
  pfx_how_validate: 'Validar os arquivos no menu Validar Arquivos para garantir que o certificado e a chave privada correspondem, antes de gerar o PFX.',
  pfx_self_signed_note: 'Deseja gerar um PFX auto-assinado? Use o menu Certificados de Aplicação.',
  pfx_err_load: 'Erro ao carregar arquivos',
  pfx_err_gen: 'Erro ao gerar PFX',
  pfx_err_dl: 'Erro ao fazer download',
  pfx_success_gen: 'PFX gerado com sucesso!',
  pfx_success_dl: 'Download iniciado!',
  ac_title: 'Certificados de Aplicação',
  ac_subtitle: 'Gere certificados autoassinados e arquivos PFX para autenticação mútua (mTLS) entre sistemas.',
  ac_how_title: 'Como funciona a autenticação server-to-server?',
  ac_how_desc: 'Na comunicação mTLS (mutual TLS), ambos os lados se identificam com certificados. O fluxo típico entre sua aplicação e um parceiro é:',
  ac_step1_title: 'Gere seu par cert + chave',
  ac_step1_desc: 'Use a aba "Certificado Autoassinado" abaixo. Defina o Common Name como o identificador da sua aplicação (ex: minha-api.empresa.com).',
  ac_step2_title: 'Gere o PFX',
  ac_step2_desc: 'Na aba "Gerar PFX", combine seu certificado e sua chave privada em um único arquivo .pfx protegido por senha.',
  ac_step3_title: 'Entregue o certificado ao parceiro',
  ac_step3_desc: 'Exporte apenas o certificado (.pem) e envie ao parceiro. Ele adicionará seu certificado à lista de certificados confiáveis (truststore).',
  ac_step4_title: 'Configure sua aplicação',
  ac_step4_desc: 'Use o arquivo PFX (com a senha gerada) na configuração do cliente HTTP da sua aplicação para autenticar as chamadas.',
  ac_step_label: 'Passo',
  ac_docs_link: 'Ainda com dúvidas? Veja essa documentação',
  ac_code_title: 'Exemplos de código — como usar o PFX na sua aplicação',
  ac_tab0: 'Certificado Autoassinado',
  ac_tab1: 'Gerar PFX (cert + chave)',
  ac_what_is_title: 'O que é um certificado autoassinado?',
  ac_what_is_desc: 'Um certificado autoassinado é emitido e assinado pela própria entidade, sem uma autoridade certificadora (CA) pública. É ideal para autenticação mTLS entre sistemas internos ou parceiros que confiam explicitamente no seu certificado.',
  ac_identity_title: 'Identidade do Certificado',
  ac_cn_hint: 'Identificador principal — geralmente o hostname ou nome da aplicação',
  ac_tech_title: 'Configurações Técnicas',
  ac_val_90: '90 dias (3 meses)',
  ac_val_180: '180 dias (6 meses)',
  ac_val_1y: '1 ano',
  ac_val_2y: '2 anos',
  ac_val_3y: '3 anos',
  ac_val_5y: '5 anos',
  ac_key_type_label: 'Tipo de Chave',
  ac_key_size_label: 'Tamanho / Curva',
  ac_san_title: 'Subject Alternative Names (SAN)',
  ac_san_hint: 'Adicione hostnames ou IPs extras que este certificado deve cobrir. Recomendado para mTLS.',
  ac_san_placeholder: 'api.empresa.com ou 192.168.1.10',
  ac_sys_title: 'Identificação no Sistema',
  ac_filename_hint: 'Apenas letras, números, _ e -',
  ac_generating: 'Gerando...',
  ac_generate_btn: 'Gerar Certificado Autoassinado',
  ac_success_title: 'Certificado gerado com sucesso!',
  ac_success_desc: 'O certificado e a chave privada foram salvos na sua biblioteca de arquivos.',
  ac_cert_title: 'Certificado',
  ac_copy_pem: 'Copiar PEM',
  ac_cert_copied: 'Copiado!',
  ac_key_copied: 'Copiado!',
  ac_cert_send_desc: 'Envie este certificado ao parceiro para que ele confie na sua identidade.',
  ac_key_title: 'Chave Privada',
  ac_key_warning: 'Nunca compartilhe a chave privada. Apenas o certificado deve ser enviado ao parceiro.',
  ac_next_step: 'Próximo passo: vá para a aba "Gerar PFX" e combine este certificado com sua chave para criar o arquivo PFX que será usado pela sua aplicação.',
  ac_pfx_tab_title: 'PFX para autenticação de aplicação (sem CA Bundle)',
  ac_pfx_tab_desc: 'Neste fluxo você combina apenas o certificado e a chave privada em um PFX. Isso é o suficiente para mTLS quando o parceiro já cadastrou seu certificado no truststore dele. Não é necessário incluir um CA Bundle.',
  ac_select_cert_placeholder: 'Selecione um certificado',
  ac_select_key_placeholder: 'Selecione uma chave privada',
  ac_pfx_name_hint: 'Apenas letras, números, _ e -',
  ac_pfx_generating: 'Gerando...',
  ac_pfx_generate_btn: 'Gerar PFX',
  ac_pfx_success_title: 'PFX gerado',
  ac_pfx_pwd_title: 'Senha do PFX — exibida apenas uma vez',
  ac_pfx_copied: 'Copiado!',
  ac_what_todo_title: 'O que fazer com o PFX?',
  ac_todo_1: 'O arquivo .pfx contém o certificado + chave privada em formato PKCS#12.',
  ac_todo_2: 'A senha gerada é aleatória e única — guarde-a no cofre de senhas da equipe.',
  ac_todo_3: 'Configure sua aplicação para usar o .pfx na autenticação mTLS (veja exemplos acima).',
  ac_todo_4: 'Não inclua a chave privada em repositórios de código. Use variáveis de ambiente ou cofres de segredos.',
  ac_todo_5: 'Quando o certificado vencer, gere um novo par e um novo PFX. Notifique o parceiro com antecedência.',
  ac_err_load: 'Erro ao carregar arquivos',
  ac_err_cert: 'Erro ao gerar certificado',
  ac_err_pfx: 'Erro ao gerar PFX',
  ac_err_dl: 'Erro ao fazer download',
  ac_success_cert: 'Certificado autoassinado gerado com sucesso!',
  ac_success_pfx: 'PFX gerado com sucesso!',
  ac_copied: 'Copiado!',
  ac_fill_required: 'Preencha pelo menos o Common Name e o Nome do arquivo.',
  ac_fill_pfx_required: 'Selecione o certificado, a chave e defina um nome.',
  sf_title: 'Arquivos Compartilhados',
  sf_tab_with_me: 'Compartilhados Comigo',
  sf_tab_by_me: 'Compartilhados Por Mim',
  sf_col_type: 'Tipo',
  sf_col_name: 'Nome',
  sf_col_shared_with: 'Compartilhado com',
  sf_col_shared_by: 'Compartilhado por',
  sf_col_date: 'Data',
  sf_col_actions: 'Ações',
  sf_no_files: 'Nenhum arquivo encontrado.',
  sf_dl_success: 'Download iniciado!',
  sf_dl_err: 'Erro ao fazer download',
  sf_remove_confirm: 'Deseja remover este arquivo da sua visualização? O dono original não perderá o arquivo.',
  sf_removed_success: 'Arquivo removido da sua lista.',
  sf_err_remove: 'Erro ao remover arquivo',
  sf_revoke_confirm: 'Deseja revogar o acesso a este arquivo? O usuário destino perderá o acesso instantaneamente.',
  sf_revoked_success: 'Acesso revogado com sucesso.',
  sf_err_revoke: 'Erro ao revogar acesso',
  sf_revoke_tip: 'Revogar Acesso',
  sf_remove_tip: 'Remover da minha visualização',
  sf_err_load: 'Erro ao carregar arquivos compartilhados',
  gk_title: 'Gerar Chave Privada',
  gk_subtitle: 'Gere uma nova chave privada para uso em certificados SSL/TLS. Suporta RSA (2048/3072/4096 bits) e Elliptic Curve (P-256/P-384).',
  gk_key_type_title: 'Tipo de Chave',
  gk_key_type_hint: 'RSA é o padrão mais compatível. EC (Elliptic Curve) é mais moderno e eficiente.',
  gk_key_size_rsa: 'Tamanho da Chave (bits)',
  gk_key_size_ec: 'Curva Elíptica',
  gk_default: 'padrão',
  gk_high_security: 'alta segurança',
  gk_custom_name_title: 'Nome Personalizado',
  gk_custom_name_hint: 'Digite um nome único para identificar facilmente esta chave',
  gk_custom_name_required: 'Nome é obrigatório',
  gk_name_pattern: 'Use apenas letras, números, _ e -',
  gk_desc_title: 'Descrição',
  gk_desc_hint: 'Adicione uma descrição para lembrar o propósito desta chave',
  gk_tags_hint: 'Adicione tags para facilitar a busca e organização',
  gk_tag_placeholder: 'Digite uma tag e pressione Enter',
  gk_generating: 'Gerando...',
  gk_generate_btn: 'Gerar Chave Privada',
  gk_success_title: 'Chave privada gerada com sucesso!',
  gk_success_type: 'Tipo',
  gk_success_size: 'Tamanho',
  gk_success_important: 'Importante: Faça o download e armazene sua chave privada em local seguro. Ela é essencial para usar certificados SSL/TLS.',
  gk_info_title: 'Informações sobre Chaves Privadas',
  gk_info_desc: 'Uma chave privada RSA é um componente fundamental da criptografia SSL/TLS. Ela é usada para:',
  gk_info_li1: 'Gerar Certificate Signing Requests (CSRs)',
  gk_info_li2: 'Descriptografar dados criptografados com a chave pública correspondente',
  gk_info_li3: 'Criar assinaturas digitais para autenticação',
  gk_security_warning: 'Segurança: Nunca compartilhe sua chave privada! Mantenha-a segura e faça backups em locais protegidos.',
  gk_import_title: 'Importando Chaves Existentes',
  gk_import_desc: 'Se você já possui uma chave privada e deseja importá-la, certifique-se de que ela não está protegida por senha. Para remover a senha de uma chave privada:',
  gk_import_note: 'Você será solicitado a digitar a senha atual da chave. O arquivo resultante não terá senha.',
  gk_err_gen: 'Erro ao gerar chave privada',
  gk_success_gen: 'Chave privada gerada com sucesso!',
  gk_success_dl: 'Download iniciado!',
  gk_err_dl: 'Erro ao fazer download',
  fp_title: 'Alteração de Senha Obrigatória',
  fp_first_access: 'Primeiro acesso detectado',
  fp_first_access_desc: 'Por segurança, você deve definir uma nova senha antes de continuar. A senha padrão é conhecida e representa um risco crítico.',
  fp_security_title: 'Recomendações de Segurança para Conta Master',
  fp_tip1: 'Use no mínimo 12 caracteres com letras, números e símbolos.',
  fp_tip2: 'Não reutilize senhas de outros sistemas ou serviços.',
  fp_tip3: 'Armazene a senha em um gerenciador de senhas corporativo.',
  fp_tip4: 'Nunca compartilhe as credenciais de administrador.',
  fp_tip5: 'Esta conta tem acesso a todos os certificados e usuários do sistema.',
  fp_tip6: 'Em caso de suspeita de comprometimento, altere a senha imediatamente e notifique a equipe de segurança.',
  fp_current_pwd: 'Senha Atual',
  fp_new_pwd: 'Nova Senha',
  fp_confirm_pwd: 'Confirmar Nova Senha',
  fp_strength: 'Força da senha',
  fp_weak: 'Fraca',
  fp_fair: 'Razoável',
  fp_good: 'Boa',
  fp_strong: 'Forte',
  fp_mismatch: 'As senhas não coincidem.',
  fp_fill_all: 'Preencha todos os campos.',
  fp_mismatch_err: 'As senhas não coincidem.',
  fp_min_8: 'A senha deve ter pelo menos 8 caracteres.',
  fp_too_weak: 'Escolha uma senha mais forte.',
  fp_changing: 'Alterando...',
  fp_set_btn: 'Definir Nova Senha e Continuar',
  fp_success: 'Senha alterada com sucesso! Bem-vindo ao SSL Manager.',
  fp_err: 'Erro ao alterar senha.',
  csr_title: 'Gerar CSR',
  csr_subtitle: 'Gere um Certificate Signing Request (CSR) para solicitar um certificado SSL/TLS a uma autoridade certificadora.',
  csr_cn_label: 'Common Name (domínio)',
  csr_cn_required: 'Common Name é obrigatório',
  csr_country_label: 'País (código 2 letras)',
  csr_country_required: 'País é obrigatório',
  csr_state_label: 'Estado / Província',
  csr_state_required: 'Estado é obrigatório',
  csr_locality_label: 'Cidade',
  csr_locality_required: 'Cidade é obrigatória',
  csr_org_label: 'Organização',
  csr_org_required: 'Organização é obrigatória',
  csr_ou_label: 'Unidade Organizacional',
  csr_email_label: 'E-mail',
  csr_wildcard_label: 'Certificado Wildcard (*.dominio.com)',
  csr_wildcard_hint: 'Um certificado wildcard cobre todos os subdomínios de um domínio.',
  csr_san_label: 'Subject Alternative Names (SANs)',
  csr_san_placeholder: 'Digite um domínio e pressione Enter',
  csr_san_include_cn: 'Incluir Common Name nos SANs',
  csr_key_type_label: 'Tipo de Chave',
  csr_key_size_label: 'Tamanho / Curva',
  csr_custom_name_label: 'Nome do arquivo',
  csr_custom_name_required: 'Nome é obrigatório',
  csr_name_pattern: 'Use apenas letras, números, _ e -',
  csr_desc_label: 'Descrição',
  csr_tag_placeholder: 'Digite uma tag e pressione Enter',
  csr_generating: 'Gerando...',
  csr_generate_btn: 'Gerar CSR',
  csr_success_title: 'CSR gerado com sucesso!',
  csr_copy_csr: 'Copiar CSR',
  csr_csr_copied: 'CSR copiado!',
  csr_key_generated: 'Uma chave privada foi gerada automaticamente.',
  csr_key_label: 'Chave privada gerada:',
  csr_info_section: 'O que é um CSR?',
  csr_err_gen: 'Erro ao gerar CSR',
  csr_success_gen: 'CSR gerado com sucesso!',
  csr_err_dl: 'Erro ao fazer download',
  csr_success_dl: 'Download iniciado!',
  ssh_title: 'Chaves SSH',
  ssh_subtitle: 'Gerencie e gere pares de chaves SSH para acesso seguro a servidores.',
  ssh_key_name_label: 'Nome da chave',
  ssh_key_name_required: 'Nome é obrigatório',
  ssh_key_type_label: 'Tipo de chave',
  ssh_key_size_label: 'Tamanho',
  ssh_comment_label: 'Comentário (opcional)',
  ssh_generating: 'Gerando...',
  ssh_generate_btn: 'Gerar Par de Chaves SSH',
  ssh_success_title: 'Par de chaves SSH gerado com sucesso!',
  ssh_pub_key_label: 'Chave Pública',
  ssh_priv_key_label: 'Chave Privada',
  ssh_copy_pub: 'Copiar chave pública',
  ssh_copy_priv: 'Copiar chave privada',
  ssh_pub_copied: 'Chave pública copiada!',
  ssh_priv_copied: 'Chave privada copiada!',
  ssh_download_pub: 'Download chave pública',
  ssh_download_priv: 'Download chave privada',
  ssh_warning: 'Nunca compartilhe sua chave privada SSH!',
  ssh_err_gen: 'Erro ao gerar chaves SSH',
  ssh_err_load: 'Erro ao carregar chaves SSH',
  ssh_delete_confirm: 'Tem certeza que deseja excluir esta chave SSH?',
  ssh_delete_success: 'Chave SSH excluída com sucesso.',
  ssh_err_delete: 'Erro ao excluir chave SSH',
  val_title: 'Validar Arquivos',
  val_subtitle: 'Valide certificados, chaves privadas e outros arquivos SSL/TLS.',
  val_mode_upload: 'Enviar arquivo',
  val_mode_existing: 'Arquivo existente',
  val_upload_hint: 'Arraste e solte ou clique para selecionar',
  val_file_type_label: 'Tipo de arquivo',
  val_file_all: 'Todos',
  val_pfx_pwd_label: 'Senha do PFX',
  val_validate_btn: 'Validar',
  val_validating: 'Validando...',
  val_result_title: 'Resultado da Validação',
  val_valid: 'Válido',
  val_invalid: 'Inválido',
  val_cert_details: 'Detalhes do certificado',
  val_err_load: 'Erro ao carregar arquivos',
  val_err_validate: 'Erro ao validar arquivo',
  val_no_file: 'Selecione um arquivo para validar',
  val_cert_match: 'Certificado e chave privada correspondem',
  val_cert_no_match: 'Certificado e chave privada NÃO correspondem',
  forgot_title: 'Recuperar Senha',
  forgot_subtitle: 'Digite seu e-mail para receber as instruções de recuperação de senha.',
  forgot_email_label: 'E-mail',
  forgot_send_btn: 'Enviar',
  forgot_sending: 'Enviando...',
  forgot_success: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.',
  forgot_back_login: 'Voltar ao login',
  forgot_err: 'Erro ao enviar e-mail',
  upload_title: 'Importar Arquivo',
  upload_drop_hint: 'Arraste e solte o arquivo aqui, ou clique para selecionar',
  upload_select_type: 'Tipo de arquivo',
  upload_type_required: 'Selecione o tipo de arquivo',
  upload_custom_name: 'Nome personalizado',
  upload_custom_name_required: 'Nome é obrigatório',
  upload_name_pattern: 'Use apenas letras, números, _ e -',
  upload_desc: 'Descrição (opcional)',
  upload_tag_placeholder: 'Digite uma tag e pressione Enter',
  upload_uploading: 'Enviando...',
  upload_btn: 'Importar',
  upload_success: 'Arquivo importado com sucesso!',
  upload_err: 'Erro ao importar arquivo',
  upload_no_file: 'Selecione um arquivo para importar',
  acd_title: 'Documentação: Autenticação Server-to-Server (mTLS)',
  acd_subtitle: 'Guia definitivo para desenvolvedores sobre como utilizar certificados para garantir segurança na comunicação entre microsserviços.',
  acd_back_btn: 'Voltar para Certificados',
  acd_mtls_title: '1. O que é mTLS (Mutual TLS)?',
  acd_fields_title: '2. Para que servem os campos de geração?',
  acd_nginx_title: '3. Como configurar o NGINX / API Gateway',
  forgot_step1: 'Identificação',
  forgot_step2: 'Pergunta de Segurança',
  forgot_step3: 'Nova Senha',
  forgot_username_label: 'Nome de Usuário',
  forgot_checking: 'Verificando...',
  forgot_continue: 'Continuar',
  forgot_security_answer_label: 'Resposta de Segurança',
  forgot_answer_helper: 'Digite exatamente como cadastrou (não diferencia maiúsculas)',
  forgot_changing: 'Alterando senha...',
  forgot_change_btn: 'Alterar Senha',
  forgot_user_not_found: 'Usuário não encontrado',
  forgot_wrong_answer: 'Resposta de segurança incorreta',
  forgot_reset_err: 'Erro ao resetar senha',
  cpd_min_err: 'A nova senha deve ter pelo menos 6 caracteres',
  cpd_min_chars: 'Mínimo de 6 caracteres',
  cpd_changing: 'Alterando...',
  cpd_change_btn: 'Alterar',
  ssh_passphrase_title: 'Proteger com Passphrase',
  ssh_passphrase_on: 'Ativado',
  ssh_passphrase_off: 'Desativado',
  ssh_no_passphrase_alert_title: 'Atenção — chave sem proteção',
  ssh_no_passphrase_alert_desc: 'Sem passphrase, qualquer pessoa com acesso ao arquivo da chave privada poderá usá-la imediatamente. Use esta opção apenas em ambientes de CI/CD ou quando a gestão de senhas não é viável.',
  ssh_confirm_passphrase_label: 'Confirmar Passphrase',
  ssh_passphrase_mismatch: 'Passphrases não coincidem',
  ssh_my_keys_title: 'Minhas Chaves SSH',
  ssh_no_keys_msg: 'Nenhuma chave SSH gerada ainda.',
  ssh_col_comment: 'Comentário',
  ssh_col_passphrase: 'Passphrase',
  ssh_col_created: 'Criado em',
  ssh_delete_dialog_title: 'Excluir Chave SSH',
  ssh_delete_irreversible_msg: 'Esta ação é irreversível. O arquivo da chave privada será removido do disco.',
  ssh_removing: 'Removendo...',
  csr_cert_info_title: 'Informações do Certificado',
  csr_file_id_title: 'Identificação do Arquivo',
  csr_invalid_domain: 'Formato de domínio inválido',
  val_file_selected_prefix: 'Arquivo selecionado:',
  val_accepted_formats: 'Formatos aceitos: .pem, .key, .crt, .cer, .csr, .pfx, .p12',
  val_pfx_loading_pwd: 'Carregando senha...',
  upload_csr_err: 'CSR deve ser gerado pela plataforma, não importado',
  upload_pfx_err: 'PFX deve ser gerado pela plataforma, não importado',
  upload_encrypted_key_err: 'Esta chave privada está protegida por senha. Por favor, remova a senha antes de importar.',
  login_subtitle: 'Faça login para acessar o gerenciador',
  login_username: 'Usuário',
  login_username_required: 'Usuário é obrigatório',
  login_password: 'Senha',
  login_password_required: 'Senha é obrigatória',
  login_sign_in: 'Entrar',
  login_signing_in: 'Entrando...',
  login_error: 'Usuário ou senha inválidos',
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
  nav_shared_files: 'Shared Files',
  app_title: 'SSL/TLS Certificate Manager',
  theme_dark: 'Dark Mode',
  theme_light: 'Light Mode',
  toggle_theme: 'Toggle theme',
  logout: 'Sign Out',
  change_password: 'Change Password',
  pwd_current: 'Current Password',
  pwd_new: 'New Password',
  pwd_confirm: 'Confirm New Password',
  pwd_min_chars: 'Minimum 8 characters',
  pwd_saving: 'Saving...',
  pwd_mismatch_err: 'Passwords do not match',
  pwd_min_err: 'New password must be at least 8 characters',
  pwd_changed: 'Password changed successfully!',
  pwd_change_err: 'Error changing password',
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
  dash_refresh: 'Refresh statistics',
  dash_keys: 'Private Keys',
  dash_certs: 'Certificates',
  dash_bundles: 'CA Bundles',
  dash_csrs: 'CSRs',
  dash_pfxs: 'PFX Files',
  dash_total: 'Total Files',
  dash_ok_title: 'Everything looks good!',
  dash_ok_msg: 'No certificates expiring in the next 30 days.',
  dash_exp_title: 'Certificate Expired!',
  dash_today_title: 'Expires Today!',
  dash_crit_title: 'Critical Expiry Risk',
  dash_urg_title: 'Urgent Attention',
  dash_warn_title: 'Expiry Warning',
  dash_expired_msg: "File '{name}' has expired and is no longer valid.",
  dash_today_msg: "File '{name}' expires today!",
  dash_days_msg: "File '{name}' expires in {days} day(s).",
  files_title: 'My Files',
  files_import: 'Import File',
  files_export_csv: 'Export CSV',
  files_search: 'Search by name, description or tags...',
  files_all: 'All',
  files_import_date: 'Import Date',
  files_downloading: 'Download started!',
  files_del_confirm: 'Are you sure you want to delete',
  files_del_success: 'File deleted successfully',
  files_copy_pwd: 'Copy password',
  files_view_pwd: 'View password',
  files_export_success: 'CSV exported successfully!',
  files_type_private_key: 'Private Key',
  files_type_cert: 'Certificate',
  files_type_ca_bundle: 'CA Bundle',
  files_type_csr: 'CSR',
  files_type_pfx: 'PFX',
  files_rows_per_page: 'Rows per page:',
  files_share: 'Share',
  files_share_title: 'Share File',
  files_share_email_label: 'User email',
  files_share_desc: 'Enter the email of the user you want to share with',
  files_sharing: 'Sharing...',
  files_share_btn: 'Share',
  files_share_success: 'File shared successfully!',
  files_share_err: 'Error sharing file',
  files_dl_err: 'Error downloading file',
  files_del_err: 'Error deleting file',
  files_load_err: 'Error loading files',
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
  um_refresh: 'Refresh',
  um_stat_total: 'Total Users',
  um_stat_active: 'Active Users',
  um_stat_blocked: 'Blocked Users',
  um_stat_ssl: 'SSL/TLS Files',
  um_col_user: 'User',
  um_col_email: 'E-mail',
  um_col_profile: 'Role',
  um_col_last_login: 'Last Login',
  um_col_created: 'Created at',
  um_must_change_pwd: 'Must change password',
  um_block_access: 'Block access',
  um_unblock_access: 'Unblock access',
  um_reset_tip: 'Reset password',
  um_delete_tip: 'Delete user and data',
  um_blocked_chip: 'Blocked',
  um_create_title: 'Create New User',
  um_auto_pwd_info: 'The system will automatically generate a secure random password. The user will be required to change it on first login.',
  um_fullname_field: 'Full name',
  um_username_field: 'Username',
  um_email_field: 'E-mail',
  um_role_field: 'Role',
  um_role_user: 'User',
  um_role_admin: 'Administrator',
  um_creating: 'Creating...',
  um_done: 'Done',
  um_created_title: 'User created successfully!',
  um_temp_pwd_send: 'Send this temporary password to the user:',
  um_fill_all: 'Please fill in all fields.',
  um_pwd_min_8: 'Password must be at least 8 characters.',
  um_reset_dialog_title: 'Reset Password',
  um_reset_force_info: 'The user will be required to change password on next login.',
  um_new_temp_pwd: 'New temporary password',
  um_min_8_helper: 'Minimum 8 characters',
  um_resetting: 'Resetting...',
  um_reset_btn: 'Reset Password',
  um_delete_dialog_title: 'Delete User',
  um_delete_warning: 'This action is irreversible. All SSL/TLS files and SSH keys of the user will be permanently removed.',
  um_delete_confirm_msg: 'Confirm deletion of',
  um_deleting: 'Removing...',
  um_delete_permanent: 'Delete Permanently',
  um_err_load: 'Error loading users',
  um_err_create: 'Error creating user',
  um_err_update: 'Error updating user',
  um_err_reset: 'Error resetting password',
  um_err_delete: 'Error deleting user',
  um_blocked_success: 'blocked',
  um_unblocked_success: 'unblocked',
  um_reset_success: 'Password reset. The user will need to change it on next login.',
  um_delete_success: 'User and all their data have been removed.',
  pfx_title: 'Generate PFX',
  pfx_subtitle: 'Combine certificate, private key and CA bundle into a password-protected PFX file.',
  pfx_select_section: 'Select Files',
  pfx_cert_required: 'Certificate is required',
  pfx_select_cert: 'Select a certificate',
  pfx_ca_required: 'CA Bundle is required',
  pfx_select_ca: 'Select a CA Bundle',
  pfx_key_required: 'Private key is required',
  pfx_select_key: 'Select a private key',
  pfx_id_section: 'File Identification',
  pfx_custom_name: 'Custom Name',
  pfx_name_required: 'Name is required',
  pfx_name_pattern: 'Use only letters, numbers, _ and -',
  pfx_desc_placeholder: 'Full PFX for server installation',
  pfx_tag_placeholder: 'Type a tag and press Enter',
  pfx_tag_hint: 'Add tags to facilitate search',
  pfx_generating: 'Generating...',
  pfx_generate_btn: 'Generate PFX',
  pfx_success_msg: 'PFX generated successfully!',
  pfx_dl_btn: 'Download PFX',
  pfx_pwd_title: 'PFX Password',
  pfx_pwd_warning: 'WARNING: This password is shown only once! Copy and store it in a safe place.',
  pfx_pwd_copy: 'Copy password',
  pfx_pwd_copied: 'Copied!',
  pfx_pwd_length: 'Password: 25 characters (uppercase, lowercase and numbers)',
  pfx_info_title: 'What is a PFX file?',
  pfx_info_desc: 'A PFX file (also known as PKCS#12) is a file format that contains:',
  pfx_contains_header: 'PFX contents:',
  pfx_contains_cert: 'The SSL/TLS certificate',
  pfx_contains_key: 'The corresponding private key',
  pfx_contains_chain: 'The intermediate certificate chain (CA Bundle)',
  pfx_usage_desc: 'All in a single password-protected file, making it easy to install on Windows/IIS, Exchange, and other systems.',
  pfx_how_title: 'How to generate correctly?',
  pfx_how_desc: 'To generate the PFX correctly, you need to:',
  pfx_how_export: 'Export the Certificate and CA Bundle provided by your external Certificate Authority (GlobalSign, Let\'s Encrypt, DigiCert, etc).',
  pfx_how_import: 'Import those files into SSL Manager via the My Files menu.',
  pfx_how_validate: 'Validate the files in the Validate Files menu to ensure the certificate and private key match, before generating the PFX.',
  pfx_self_signed_note: 'Want to generate a self-signed PFX? Use the App Certificates menu.',
  pfx_err_load: 'Error loading files',
  pfx_err_gen: 'Error generating PFX',
  pfx_err_dl: 'Error downloading',
  pfx_success_gen: 'PFX generated successfully!',
  pfx_success_dl: 'Download started!',
  ac_title: 'App Certificates',
  ac_subtitle: 'Generate self-signed certificates and PFX files for mutual authentication (mTLS) between systems.',
  ac_how_title: 'How does server-to-server authentication work?',
  ac_how_desc: 'In mTLS (mutual TLS) communication, both sides identify themselves with certificates. The typical flow between your application and a partner is:',
  ac_step1_title: 'Generate your cert + key pair',
  ac_step1_desc: 'Use the "Self-Signed Certificate" tab below. Set the Common Name as your application identifier (e.g., my-api.company.com).',
  ac_step2_title: 'Generate the PFX',
  ac_step2_desc: 'In the "Generate PFX" tab, combine your certificate and private key into a single password-protected .pfx file.',
  ac_step3_title: 'Deliver the certificate to your partner',
  ac_step3_desc: 'Export only the certificate (.pem) and send it to your partner. They will add your certificate to their trusted certificates list (truststore).',
  ac_step4_title: 'Configure your application',
  ac_step4_desc: 'Use the PFX file (with the generated password) in your application\'s HTTP client configuration to authenticate calls.',
  ac_step_label: 'Step',
  ac_docs_link: 'Still have questions? View this documentation',
  ac_code_title: 'Code examples — how to use the PFX in your application',
  ac_tab0: 'Self-Signed Certificate',
  ac_tab1: 'Generate PFX (cert + key)',
  ac_what_is_title: 'What is a self-signed certificate?',
  ac_what_is_desc: 'A self-signed certificate is issued and signed by the entity itself, without a public Certificate Authority (CA). It is ideal for mTLS authentication between internal systems or partners that explicitly trust your certificate.',
  ac_identity_title: 'Certificate Identity',
  ac_cn_hint: 'Main identifier — usually the hostname or application name',
  ac_tech_title: 'Technical Settings',
  ac_val_90: '90 days (3 months)',
  ac_val_180: '180 days (6 months)',
  ac_val_1y: '1 year',
  ac_val_2y: '2 years',
  ac_val_3y: '3 years',
  ac_val_5y: '5 years',
  ac_key_type_label: 'Key Type',
  ac_key_size_label: 'Size / Curve',
  ac_san_title: 'Subject Alternative Names (SAN)',
  ac_san_hint: 'Add extra hostnames or IPs that this certificate should cover. Recommended for mTLS.',
  ac_san_placeholder: 'api.company.com or 192.168.1.10',
  ac_sys_title: 'System Identification',
  ac_filename_hint: 'Only letters, numbers, _ and -',
  ac_generating: 'Generating...',
  ac_generate_btn: 'Generate Self-Signed Certificate',
  ac_success_title: 'Certificate generated successfully!',
  ac_success_desc: 'The certificate and private key have been saved to your file library.',
  ac_cert_title: 'Certificate',
  ac_copy_pem: 'Copy PEM',
  ac_cert_copied: 'Copied!',
  ac_key_copied: 'Copied!',
  ac_cert_send_desc: 'Send this certificate to your partner so they can trust your identity.',
  ac_key_title: 'Private Key',
  ac_key_warning: 'Never share the private key. Only the certificate should be sent to the partner.',
  ac_next_step: 'Next step: go to the "Generate PFX" tab and combine this certificate with its key to create the PFX file used by your application.',
  ac_pfx_tab_title: 'PFX for application authentication (without CA Bundle)',
  ac_pfx_tab_desc: 'In this flow you combine only the certificate and private key into a PFX. This is sufficient for mTLS when the partner has already registered your certificate in their truststore. No CA Bundle needed.',
  ac_select_cert_placeholder: 'Select a certificate',
  ac_select_key_placeholder: 'Select a private key',
  ac_pfx_name_hint: 'Only letters, numbers, _ and -',
  ac_pfx_generating: 'Generating...',
  ac_pfx_generate_btn: 'Generate PFX',
  ac_pfx_success_title: 'PFX generated',
  ac_pfx_pwd_title: 'PFX Password — shown only once',
  ac_pfx_copied: 'Copied!',
  ac_what_todo_title: 'What to do with the PFX?',
  ac_todo_1: 'The .pfx file contains the certificate + private key in PKCS#12 format.',
  ac_todo_2: 'The generated password is random and unique — store it in your team\'s password vault.',
  ac_todo_3: 'Configure your application to use the .pfx for mTLS authentication (see code examples above).',
  ac_todo_4: 'Do not include the private key in code repositories. Use environment variables or secret vaults.',
  ac_todo_5: 'When the certificate expires, generate a new pair and a new PFX. Notify the partner in advance.',
  ac_err_load: 'Error loading files',
  ac_err_cert: 'Error generating certificate',
  ac_err_pfx: 'Error generating PFX',
  ac_err_dl: 'Error downloading',
  ac_success_cert: 'Self-signed certificate generated successfully!',
  ac_success_pfx: 'PFX generated successfully!',
  ac_copied: 'Copied!',
  ac_fill_required: 'Please fill in at least the Common Name and File Name.',
  ac_fill_pfx_required: 'Please select the certificate, key and set a name.',
  sf_title: 'Shared Files',
  sf_tab_with_me: 'Shared With Me',
  sf_tab_by_me: 'Shared By Me',
  sf_col_type: 'Type',
  sf_col_name: 'Name',
  sf_col_shared_with: 'Shared with',
  sf_col_shared_by: 'Shared by',
  sf_col_date: 'Date',
  sf_col_actions: 'Actions',
  sf_no_files: 'No files found.',
  sf_dl_success: 'Download started!',
  sf_dl_err: 'Error downloading file',
  sf_remove_confirm: 'Do you want to remove this file from your view? The original owner will not lose the file.',
  sf_removed_success: 'File removed from your list.',
  sf_err_remove: 'Error removing file',
  sf_revoke_confirm: 'Do you want to revoke access to this file? The target user will instantly lose access.',
  sf_revoked_success: 'Access revoked successfully.',
  sf_err_revoke: 'Error revoking access',
  sf_revoke_tip: 'Revoke Access',
  sf_remove_tip: 'Remove from my view',
  sf_err_load: 'Error loading shared files',
  gk_title: 'Generate Private Key',
  gk_subtitle: 'Generate a new private key for use in SSL/TLS certificates. Supports RSA (2048/3072/4096 bits) and Elliptic Curve (P-256/P-384).',
  gk_key_type_title: 'Key Type',
  gk_key_type_hint: 'RSA is the most compatible standard. EC (Elliptic Curve) is more modern and efficient.',
  gk_key_size_rsa: 'Key Size (bits)',
  gk_key_size_ec: 'Elliptic Curve',
  gk_default: 'default',
  gk_high_security: 'high security',
  gk_custom_name_title: 'Custom Name',
  gk_custom_name_hint: 'Enter a unique name to easily identify this key',
  gk_custom_name_required: 'Name is required',
  gk_name_pattern: 'Use only letters, numbers, _ and -',
  gk_desc_title: 'Description',
  gk_desc_hint: 'Add a description to remember the purpose of this key',
  gk_tags_hint: 'Add tags to facilitate search and organization',
  gk_tag_placeholder: 'Type a tag and press Enter',
  gk_generating: 'Generating...',
  gk_generate_btn: 'Generate Private Key',
  gk_success_title: 'Private key generated successfully!',
  gk_success_type: 'Type',
  gk_success_size: 'Size',
  gk_success_important: 'Important: Download and store your private key in a safe place. It is essential for using SSL/TLS certificates.',
  gk_info_title: 'About Private Keys',
  gk_info_desc: 'An RSA private key is a fundamental component of SSL/TLS cryptography. It is used to:',
  gk_info_li1: 'Generate Certificate Signing Requests (CSRs)',
  gk_info_li2: 'Decrypt data encrypted with the corresponding public key',
  gk_info_li3: 'Create digital signatures for authentication',
  gk_security_warning: 'Security: Never share your private key! Keep it safe and make backups in protected locations.',
  gk_import_title: 'Importing Existing Keys',
  gk_import_desc: 'If you already have a private key and want to import it, make sure it is not password-protected. To remove the password from a private key:',
  gk_import_note: 'You will be prompted for the current key password. The resulting file will have no password.',
  gk_err_gen: 'Error generating private key',
  gk_success_gen: 'Private key generated successfully!',
  gk_success_dl: 'Download started!',
  gk_err_dl: 'Error downloading',
  fp_title: 'Mandatory Password Change',
  fp_first_access: 'First access detected',
  fp_first_access_desc: 'For security, you must set a new password before continuing. The default password is known and represents a critical risk.',
  fp_security_title: 'Security Recommendations for Master Account',
  fp_tip1: 'Use at least 12 characters with letters, numbers and symbols.',
  fp_tip2: 'Do not reuse passwords from other systems or services.',
  fp_tip3: 'Store the password in a corporate password manager.',
  fp_tip4: 'Never share administrator credentials.',
  fp_tip5: 'This account has access to all certificates and users in the system.',
  fp_tip6: 'If you suspect compromise, change the password immediately and notify the security team.',
  fp_current_pwd: 'Current Password',
  fp_new_pwd: 'New Password',
  fp_confirm_pwd: 'Confirm New Password',
  fp_strength: 'Password strength',
  fp_weak: 'Weak',
  fp_fair: 'Fair',
  fp_good: 'Good',
  fp_strong: 'Strong',
  fp_mismatch: 'Passwords do not match.',
  fp_fill_all: 'Please fill in all fields.',
  fp_mismatch_err: 'Passwords do not match.',
  fp_min_8: 'Password must be at least 8 characters.',
  fp_too_weak: 'Please choose a stronger password.',
  fp_changing: 'Changing...',
  fp_set_btn: 'Set New Password and Continue',
  fp_success: 'Password changed successfully! Welcome to SSL Manager.',
  fp_err: 'Error changing password.',
  csr_title: 'Generate CSR',
  csr_subtitle: 'Generate a Certificate Signing Request (CSR) to request an SSL/TLS certificate from a Certificate Authority.',
  csr_cn_label: 'Common Name (domain)',
  csr_cn_required: 'Common Name is required',
  csr_country_label: 'Country (2-letter code)',
  csr_country_required: 'Country is required',
  csr_state_label: 'State / Province',
  csr_state_required: 'State is required',
  csr_locality_label: 'City',
  csr_locality_required: 'City is required',
  csr_org_label: 'Organization',
  csr_org_required: 'Organization is required',
  csr_ou_label: 'Organizational Unit',
  csr_email_label: 'E-mail',
  csr_wildcard_label: 'Wildcard Certificate (*.domain.com)',
  csr_wildcard_hint: 'A wildcard certificate covers all subdomains of a domain.',
  csr_san_label: 'Subject Alternative Names (SANs)',
  csr_san_placeholder: 'Enter a domain and press Enter',
  csr_san_include_cn: 'Include Common Name in SANs',
  csr_key_type_label: 'Key Type',
  csr_key_size_label: 'Size / Curve',
  csr_custom_name_label: 'File name',
  csr_custom_name_required: 'Name is required',
  csr_name_pattern: 'Use only letters, numbers, _ and -',
  csr_desc_label: 'Description',
  csr_tag_placeholder: 'Type a tag and press Enter',
  csr_generating: 'Generating...',
  csr_generate_btn: 'Generate CSR',
  csr_success_title: 'CSR generated successfully!',
  csr_copy_csr: 'Copy CSR',
  csr_csr_copied: 'CSR copied!',
  csr_key_generated: 'A private key was automatically generated.',
  csr_key_label: 'Generated private key:',
  csr_info_section: 'What is a CSR?',
  csr_err_gen: 'Error generating CSR',
  csr_success_gen: 'CSR generated successfully!',
  csr_err_dl: 'Error downloading',
  csr_success_dl: 'Download started!',
  ssh_title: 'SSH Keys',
  ssh_subtitle: 'Manage and generate SSH key pairs for secure server access.',
  ssh_key_name_label: 'Key name',
  ssh_key_name_required: 'Name is required',
  ssh_key_type_label: 'Key type',
  ssh_key_size_label: 'Size',
  ssh_comment_label: 'Comment (optional)',
  ssh_generating: 'Generating...',
  ssh_generate_btn: 'Generate SSH Key Pair',
  ssh_success_title: 'SSH key pair generated successfully!',
  ssh_pub_key_label: 'Public Key',
  ssh_priv_key_label: 'Private Key',
  ssh_copy_pub: 'Copy public key',
  ssh_copy_priv: 'Copy private key',
  ssh_pub_copied: 'Public key copied!',
  ssh_priv_copied: 'Private key copied!',
  ssh_download_pub: 'Download public key',
  ssh_download_priv: 'Download private key',
  ssh_warning: 'Never share your private SSH key!',
  ssh_err_gen: 'Error generating SSH keys',
  ssh_err_load: 'Error loading SSH keys',
  ssh_delete_confirm: 'Are you sure you want to delete this SSH key?',
  ssh_delete_success: 'SSH key deleted successfully.',
  ssh_err_delete: 'Error deleting SSH key',
  val_title: 'Validate Files',
  val_subtitle: 'Validate certificates, private keys and other SSL/TLS files.',
  val_mode_upload: 'Upload file',
  val_mode_existing: 'Existing file',
  val_upload_hint: 'Drag and drop or click to select',
  val_file_type_label: 'File type',
  val_file_all: 'All',
  val_pfx_pwd_label: 'PFX Password',
  val_validate_btn: 'Validate',
  val_validating: 'Validating...',
  val_result_title: 'Validation Result',
  val_valid: 'Valid',
  val_invalid: 'Invalid',
  val_cert_details: 'Certificate details',
  val_err_load: 'Error loading files',
  val_err_validate: 'Error validating file',
  val_no_file: 'Select a file to validate',
  val_cert_match: 'Certificate and private key match',
  val_cert_no_match: 'Certificate and private key do NOT match',
  forgot_title: 'Recover Password',
  forgot_subtitle: 'Enter your email to receive password recovery instructions.',
  forgot_email_label: 'E-mail',
  forgot_send_btn: 'Send',
  forgot_sending: 'Sending...',
  forgot_success: 'If the email is registered, you will receive instructions shortly.',
  forgot_back_login: 'Back to login',
  forgot_err: 'Error sending email',
  upload_title: 'Import File',
  upload_drop_hint: 'Drag and drop the file here, or click to select',
  upload_select_type: 'File type',
  upload_type_required: 'Select file type',
  upload_custom_name: 'Custom name',
  upload_custom_name_required: 'Name is required',
  upload_name_pattern: 'Use only letters, numbers, _ and -',
  upload_desc: 'Description (optional)',
  upload_tag_placeholder: 'Type a tag and press Enter',
  upload_uploading: 'Uploading...',
  upload_btn: 'Import',
  upload_success: 'File imported successfully!',
  upload_err: 'Error importing file',
  upload_no_file: 'Select a file to import',
  acd_title: 'Documentation: Server-to-Server Authentication (mTLS)',
  acd_subtitle: 'Definitive guide for developers on how to use certificates to ensure security in communication between microservices.',
  acd_back_btn: 'Back to Certificates',
  acd_mtls_title: '1. What is mTLS (Mutual TLS)?',
  acd_fields_title: '2. What are the generation fields for?',
  acd_nginx_title: '3. How to configure NGINX / API Gateway',
  forgot_step1: 'Identification',
  forgot_step2: 'Security Question',
  forgot_step3: 'New Password',
  forgot_username_label: 'Username',
  forgot_checking: 'Verifying...',
  forgot_continue: 'Continue',
  forgot_security_answer_label: 'Security Answer',
  forgot_answer_helper: 'Type exactly as registered (case-insensitive)',
  forgot_changing: 'Changing password...',
  forgot_change_btn: 'Change Password',
  forgot_user_not_found: 'User not found',
  forgot_wrong_answer: 'Incorrect security answer',
  forgot_reset_err: 'Error resetting password',
  cpd_min_err: 'New password must be at least 6 characters',
  cpd_min_chars: 'Minimum 6 characters',
  cpd_changing: 'Changing...',
  cpd_change_btn: 'Change',
  ssh_passphrase_title: 'Protect with Passphrase',
  ssh_passphrase_on: 'Enabled',
  ssh_passphrase_off: 'Disabled',
  ssh_no_passphrase_alert_title: 'Warning — unprotected key',
  ssh_no_passphrase_alert_desc: 'Without a passphrase, anyone with access to the private key file can use it immediately. Use this option only in CI/CD environments or when password management is not feasible.',
  ssh_confirm_passphrase_label: 'Confirm Passphrase',
  ssh_passphrase_mismatch: 'Passphrases do not match',
  ssh_my_keys_title: 'My SSH Keys',
  ssh_no_keys_msg: 'No SSH keys generated yet.',
  ssh_col_comment: 'Comment',
  ssh_col_passphrase: 'Passphrase',
  ssh_col_created: 'Created at',
  ssh_delete_dialog_title: 'Delete SSH Key',
  ssh_delete_irreversible_msg: 'This action is irreversible. The private key file will be removed from disk.',
  ssh_removing: 'Removing...',
  csr_cert_info_title: 'Certificate Information',
  csr_file_id_title: 'File Identification',
  csr_invalid_domain: 'Invalid domain format',
  val_file_selected_prefix: 'Selected file:',
  val_accepted_formats: 'Accepted formats: .pem, .key, .crt, .cer, .csr, .pfx, .p12',
  val_pfx_loading_pwd: 'Loading password...',
  upload_csr_err: 'CSR must be generated by the platform, not imported',
  upload_pfx_err: 'PFX must be generated by the platform, not imported',
  upload_encrypted_key_err: 'This private key is password-protected. Please remove the password before importing.',
  login_subtitle: 'Sign in to access the manager',
  login_username: 'Username',
  login_username_required: 'Username is required',
  login_password: 'Password',
  login_password_required: 'Password is required',
  login_sign_in: 'Sign In',
  login_signing_in: 'Signing in...',
  login_error: 'Invalid username or password',
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
  nav_shared_files: 'Archivos Compartidos',
  app_title: 'Gestor de Certificados SSL/TLS',
  theme_dark: 'Modo Oscuro',
  theme_light: 'Modo Claro',
  toggle_theme: 'Cambiar tema',
  logout: 'Cerrar Sesión',
  change_password: 'Cambiar Contraseña',
  pwd_current: 'Contraseña Actual',
  pwd_new: 'Nueva Contraseña',
  pwd_confirm: 'Confirmar Nueva Contraseña',
  pwd_min_chars: 'Mínimo 8 caracteres',
  pwd_saving: 'Guardando...',
  pwd_mismatch_err: 'Las contraseñas no coinciden',
  pwd_min_err: 'La nueva contraseña debe tener al menos 8 caracteres',
  pwd_changed: '¡Contraseña cambiada con éxito!',
  pwd_change_err: 'Error al cambiar contraseña',
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
  dash_refresh: 'Actualizar estadísticas',
  dash_keys: 'Claves Privadas',
  dash_certs: 'Certificados',
  dash_bundles: 'CA Bundles',
  dash_csrs: 'CSRs',
  dash_pfxs: 'Archivos PFX',
  dash_total: 'Total de Archivos',
  dash_ok_title: '¡Todo en orden!',
  dash_ok_msg: 'Ningún certificado caduca en los próximos 30 días.',
  dash_exp_title: '¡Certificado Caducado!',
  dash_today_title: '¡Caduca Hoy!',
  dash_crit_title: 'Riesgo Crítico de Caducidad',
  dash_urg_title: 'Atención Urgente',
  dash_warn_title: 'Aviso de Caducidad',
  dash_expired_msg: "El archivo '{name}' ha caducado y ya no es válido.",
  dash_today_msg: "¡El archivo '{name}' caduca hoy!",
  dash_days_msg: "El archivo '{name}' caduca en {days} día(s).",
  files_title: 'Mis Archivos',
  files_import: 'Importar Archivo',
  files_export_csv: 'Exportar CSV',
  files_search: 'Buscar por nombre, descripción o etiquetas...',
  files_all: 'Todos',
  files_import_date: 'Fecha de Importación',
  files_downloading: '¡Descarga iniciada!',
  files_del_confirm: '¿Está seguro de que desea eliminar',
  files_del_success: 'Archivo eliminado con éxito',
  files_copy_pwd: 'Copiar contraseña',
  files_view_pwd: 'Ver contraseña',
  files_export_success: '¡CSV exportado con éxito!',
  files_type_private_key: 'Clave Privada',
  files_type_cert: 'Certificado',
  files_type_ca_bundle: 'CA Bundle',
  files_type_csr: 'CSR',
  files_type_pfx: 'PFX',
  files_rows_per_page: 'Filas por página:',
  files_share: 'Compartir',
  files_share_title: 'Compartir Archivo',
  files_share_email_label: 'Correo del usuario',
  files_share_desc: 'Ingrese el correo del usuario con quien desea compartir',
  files_sharing: 'Compartiendo...',
  files_share_btn: 'Compartir',
  files_share_success: '¡Archivo compartido con éxito!',
  files_share_err: 'Error al compartir archivo',
  files_dl_err: 'Error al descargar archivo',
  files_del_err: 'Error al eliminar archivo',
  files_load_err: 'Error al cargar archivos',
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
  um_refresh: 'Actualizar',
  um_stat_total: 'Total de Usuarios',
  um_stat_active: 'Usuarios Activos',
  um_stat_blocked: 'Usuarios Bloqueados',
  um_stat_ssl: 'Archivos SSL/TLS',
  um_col_user: 'Usuario',
  um_col_email: 'Correo',
  um_col_profile: 'Perfil',
  um_col_last_login: 'Último Acceso',
  um_col_created: 'Creado el',
  um_must_change_pwd: 'Debe cambiar contraseña',
  um_block_access: 'Bloquear acceso',
  um_unblock_access: 'Desbloquear acceso',
  um_reset_tip: 'Restablecer contraseña',
  um_delete_tip: 'Eliminar usuario y datos',
  um_blocked_chip: 'Bloqueado',
  um_create_title: 'Crear Nuevo Usuario',
  um_auto_pwd_info: 'El sistema generará automáticamente una contraseña segura y aleatoria. El usuario deberá cambiarla en el primer acceso.',
  um_fullname_field: 'Nombre completo',
  um_username_field: 'Nombre de usuario',
  um_email_field: 'Correo electrónico',
  um_role_field: 'Perfil',
  um_role_user: 'Usuario',
  um_role_admin: 'Administrador',
  um_creating: 'Creando...',
  um_done: 'Concluir',
  um_created_title: '¡Usuario creado con éxito!',
  um_temp_pwd_send: 'Envíe esta contraseña temporal al usuario:',
  um_fill_all: 'Complete todos los campos.',
  um_pwd_min_8: 'La contraseña debe tener al menos 8 caracteres.',
  um_reset_dialog_title: 'Restablecer Contraseña',
  um_reset_force_info: 'El usuario deberá cambiar la contraseña en el próximo acceso.',
  um_new_temp_pwd: 'Nueva contraseña temporal',
  um_min_8_helper: 'Mínimo 8 caracteres',
  um_resetting: 'Restableciendo...',
  um_reset_btn: 'Restablecer Contraseña',
  um_delete_dialog_title: 'Eliminar Usuario',
  um_delete_warning: 'Esta acción es irreversible. Todos los archivos SSL/TLS y claves SSH del usuario serán eliminados permanentemente.',
  um_delete_confirm_msg: 'Confirmar eliminación de',
  um_deleting: 'Eliminando...',
  um_delete_permanent: 'Eliminar Permanentemente',
  um_err_load: 'Error al cargar usuarios',
  um_err_create: 'Error al crear usuario',
  um_err_update: 'Error al actualizar usuario',
  um_err_reset: 'Error al restablecer contraseña',
  um_err_delete: 'Error al eliminar usuario',
  um_blocked_success: 'bloqueado',
  um_unblocked_success: 'desbloqueado',
  um_reset_success: 'Contraseña restablecida. El usuario deberá cambiarla en el próximo acceso.',
  um_delete_success: 'Usuario y todos sus datos han sido eliminados.',
  pfx_title: 'Generar PFX',
  pfx_subtitle: 'Combine certificado, clave privada y CA bundle en un archivo PFX protegido por contraseña.',
  pfx_select_section: 'Seleccione los Archivos',
  pfx_cert_required: 'El certificado es obligatorio',
  pfx_select_cert: 'Seleccione un certificado',
  pfx_ca_required: 'El CA Bundle es obligatorio',
  pfx_select_ca: 'Seleccione un CA Bundle',
  pfx_key_required: 'La clave privada es obligatoria',
  pfx_select_key: 'Seleccione una clave privada',
  pfx_id_section: 'Identificación del Archivo',
  pfx_custom_name: 'Nombre Personalizado',
  pfx_name_required: 'El nombre es obligatorio',
  pfx_name_pattern: 'Use solo letras, números, _ y -',
  pfx_desc_placeholder: 'PFX completo para instalación en servidor',
  pfx_tag_placeholder: 'Escriba una etiqueta y presione Enter',
  pfx_tag_hint: 'Agregue etiquetas para facilitar la búsqueda',
  pfx_generating: 'Generando...',
  pfx_generate_btn: 'Generar PFX',
  pfx_success_msg: '¡PFX generado con éxito!',
  pfx_dl_btn: 'Descargar PFX',
  pfx_pwd_title: 'Contraseña del PFX',
  pfx_pwd_warning: 'ADVERTENCIA: ¡Esta contraseña se muestra solo una vez! Cópiela y guárdela en un lugar seguro.',
  pfx_pwd_copy: 'Copiar contraseña',
  pfx_pwd_copied: '¡Copiado!',
  pfx_pwd_length: 'Contraseña: 25 caracteres (mayúsculas, minúsculas y números)',
  pfx_info_title: '¿Qué es un archivo PFX?',
  pfx_info_desc: 'Un archivo PFX (también conocido como PKCS#12) es un formato de archivo que contiene:',
  pfx_contains_header: 'Contenido del PFX:',
  pfx_contains_cert: 'El certificado SSL/TLS',
  pfx_contains_key: 'La clave privada correspondiente',
  pfx_contains_chain: 'La cadena de certificados intermedios (CA Bundle)',
  pfx_usage_desc: 'Todo en un único archivo protegido por contraseña, facilitando la instalación en servidores Windows/IIS, Exchange y otros sistemas.',
  pfx_how_title: '¿Cómo generar correctamente?',
  pfx_how_desc: 'Para generar el PFX correctamente, necesita:',
  pfx_how_export: 'Exportar el Certificado y el CA Bundle proporcionados por su Autoridad Certificadora externa (GlobalSign, Let\'s Encrypt, DigiCert, etc).',
  pfx_how_import: 'Importar esos archivos al SSL Manager a través del menú Mis Archivos.',
  pfx_how_validate: 'Validar los archivos en el menú Validar Archivos para garantizar que el certificado y la clave privada corresponden, antes de generar el PFX.',
  pfx_self_signed_note: '¿Desea generar un PFX autofirmado? Use el menú Certificados de Aplicación.',
  pfx_err_load: 'Error al cargar archivos',
  pfx_err_gen: 'Error al generar PFX',
  pfx_err_dl: 'Error al descargar',
  pfx_success_gen: '¡PFX generado con éxito!',
  pfx_success_dl: '¡Descarga iniciada!',
  ac_title: 'Certificados de Aplicación',
  ac_subtitle: 'Genere certificados autofirmados y archivos PFX para autenticación mutua (mTLS) entre sistemas.',
  ac_how_title: '¿Cómo funciona la autenticación server-to-server?',
  ac_how_desc: 'En la comunicación mTLS (mutual TLS), ambos lados se identifican con certificados. El flujo típico entre su aplicación y un socio es:',
  ac_step1_title: 'Genere su par cert + clave',
  ac_step1_desc: 'Use la pestaña "Certificado Autofirmado" a continuación. Defina el Common Name como el identificador de su aplicación (ej: mi-api.empresa.com).',
  ac_step2_title: 'Genere el PFX',
  ac_step2_desc: 'En la pestaña "Generar PFX", combine su certificado y clave privada en un único archivo .pfx protegido por contraseña.',
  ac_step3_title: 'Entregue el certificado al socio',
  ac_step3_desc: 'Exporte solo el certificado (.pem) y envíelo al socio. Él agregará su certificado a la lista de certificados de confianza (truststore).',
  ac_step4_title: 'Configure su aplicación',
  ac_step4_desc: 'Use el archivo PFX (con la contraseña generada) en la configuración del cliente HTTP de su aplicación para autenticar las llamadas.',
  ac_step_label: 'Paso',
  ac_docs_link: '¿Aún tiene dudas? Vea esta documentación',
  ac_code_title: 'Ejemplos de código — cómo usar el PFX en su aplicación',
  ac_tab0: 'Certificado Autofirmado',
  ac_tab1: 'Generar PFX (cert + clave)',
  ac_what_is_title: '¿Qué es un certificado autofirmado?',
  ac_what_is_desc: 'Un certificado autofirmado es emitido y firmado por la propia entidad, sin una Autoridad Certificadora (CA) pública. Es ideal para autenticación mTLS entre sistemas internos o socios que confían explícitamente en su certificado.',
  ac_identity_title: 'Identidad del Certificado',
  ac_cn_hint: 'Identificador principal — generalmente el hostname o nombre de la aplicación',
  ac_tech_title: 'Configuración Técnica',
  ac_val_90: '90 días (3 meses)',
  ac_val_180: '180 días (6 meses)',
  ac_val_1y: '1 año',
  ac_val_2y: '2 años',
  ac_val_3y: '3 años',
  ac_val_5y: '5 años',
  ac_key_type_label: 'Tipo de Clave',
  ac_key_size_label: 'Tamaño / Curva',
  ac_san_title: 'Subject Alternative Names (SAN)',
  ac_san_hint: 'Agregue hostnames o IPs adicionales que este certificado debe cubrir. Recomendado para mTLS.',
  ac_san_placeholder: 'api.empresa.com o 192.168.1.10',
  ac_sys_title: 'Identificación en el Sistema',
  ac_filename_hint: 'Solo letras, números, _ y -',
  ac_generating: 'Generando...',
  ac_generate_btn: 'Generar Certificado Autofirmado',
  ac_success_title: '¡Certificado generado con éxito!',
  ac_success_desc: 'El certificado y la clave privada han sido guardados en su biblioteca de archivos.',
  ac_cert_title: 'Certificado',
  ac_copy_pem: 'Copiar PEM',
  ac_cert_copied: '¡Copiado!',
  ac_key_copied: '¡Copiado!',
  ac_cert_send_desc: 'Envíe este certificado al socio para que confíe en su identidad.',
  ac_key_title: 'Clave Privada',
  ac_key_warning: 'Nunca comparta la clave privada. Solo el certificado debe enviarse al socio.',
  ac_next_step: 'Siguiente paso: vaya a la pestaña "Generar PFX" y combine este certificado con su clave para crear el archivo PFX que usará su aplicación.',
  ac_pfx_tab_title: 'PFX para autenticación de aplicación (sin CA Bundle)',
  ac_pfx_tab_desc: 'En este flujo combina solo el certificado y la clave privada en un PFX. Esto es suficiente para mTLS cuando el socio ya registró su certificado en su truststore. No es necesario incluir un CA Bundle.',
  ac_select_cert_placeholder: 'Seleccione un certificado',
  ac_select_key_placeholder: 'Seleccione una clave privada',
  ac_pfx_name_hint: 'Solo letras, números, _ y -',
  ac_pfx_generating: 'Generando...',
  ac_pfx_generate_btn: 'Generar PFX',
  ac_pfx_success_title: 'PFX generado',
  ac_pfx_pwd_title: 'Contraseña del PFX — mostrada solo una vez',
  ac_pfx_copied: '¡Copiado!',
  ac_what_todo_title: '¿Qué hacer con el PFX?',
  ac_todo_1: 'El archivo .pfx contiene el certificado + clave privada en formato PKCS#12.',
  ac_todo_2: 'La contraseña generada es aleatoria y única — guárdela en el almacén de contraseñas del equipo.',
  ac_todo_3: 'Configure su aplicación para usar el .pfx en la autenticación mTLS (vea ejemplos de código arriba).',
  ac_todo_4: 'No incluya la clave privada en repositorios de código. Use variables de entorno o almacenes de secretos.',
  ac_todo_5: 'Cuando el certificado expire, genere un nuevo par y un nuevo PFX. Notifique al socio con anticipación.',
  ac_err_load: 'Error al cargar archivos',
  ac_err_cert: 'Error al generar certificado',
  ac_err_pfx: 'Error al generar PFX',
  ac_err_dl: 'Error al descargar',
  ac_success_cert: '¡Certificado autofirmado generado con éxito!',
  ac_success_pfx: '¡PFX generado con éxito!',
  ac_copied: '¡Copiado!',
  ac_fill_required: 'Complete al menos el Common Name y el Nombre del archivo.',
  ac_fill_pfx_required: 'Seleccione el certificado, la clave y defina un nombre.',
  sf_title: 'Archivos Compartidos',
  sf_tab_with_me: 'Compartidos Conmigo',
  sf_tab_by_me: 'Compartidos Por Mí',
  sf_col_type: 'Tipo',
  sf_col_name: 'Nombre',
  sf_col_shared_with: 'Compartido con',
  sf_col_shared_by: 'Compartido por',
  sf_col_date: 'Fecha',
  sf_col_actions: 'Acciones',
  sf_no_files: 'No se encontraron archivos.',
  sf_dl_success: '¡Descarga iniciada!',
  sf_dl_err: 'Error al descargar archivo',
  sf_remove_confirm: '¿Desea eliminar este archivo de su vista? El propietario original no perderá el archivo.',
  sf_removed_success: 'Archivo eliminado de su lista.',
  sf_err_remove: 'Error al eliminar archivo',
  sf_revoke_confirm: '¿Desea revocar el acceso a este archivo? El usuario destino perderá el acceso instantáneamente.',
  sf_revoked_success: 'Acceso revocado con éxito.',
  sf_err_revoke: 'Error al revocar acceso',
  sf_revoke_tip: 'Revocar Acceso',
  sf_remove_tip: 'Eliminar de mi vista',
  sf_err_load: 'Error al cargar archivos compartidos',
  gk_title: 'Generar Clave Privada',
  gk_subtitle: 'Genere una nueva clave privada para usar en certificados SSL/TLS. Soporta RSA (2048/3072/4096 bits) y Curva Elíptica (P-256/P-384).',
  gk_key_type_title: 'Tipo de Clave',
  gk_key_type_hint: 'RSA es el estándar más compatible. EC (Curva Elíptica) es más moderno y eficiente.',
  gk_key_size_rsa: 'Tamaño de Clave (bits)',
  gk_key_size_ec: 'Curva Elíptica',
  gk_default: 'predeterminado',
  gk_high_security: 'alta seguridad',
  gk_custom_name_title: 'Nombre Personalizado',
  gk_custom_name_hint: 'Ingrese un nombre único para identificar fácilmente esta clave',
  gk_custom_name_required: 'El nombre es obligatorio',
  gk_name_pattern: 'Use solo letras, números, _ y -',
  gk_desc_title: 'Descripción',
  gk_desc_hint: 'Agregue una descripción para recordar el propósito de esta clave',
  gk_tags_hint: 'Agregue etiquetas para facilitar la búsqueda y organización',
  gk_tag_placeholder: 'Escriba una etiqueta y presione Enter',
  gk_generating: 'Generando...',
  gk_generate_btn: 'Generar Clave Privada',
  gk_success_title: '¡Clave privada generada con éxito!',
  gk_success_type: 'Tipo',
  gk_success_size: 'Tamaño',
  gk_success_important: 'Importante: Descargue y guarde su clave privada en un lugar seguro. Es esencial para usar certificados SSL/TLS.',
  gk_info_title: 'Acerca de las Claves Privadas',
  gk_info_desc: 'Una clave privada RSA es un componente fundamental de la criptografía SSL/TLS. Se utiliza para:',
  gk_info_li1: 'Generar Certificate Signing Requests (CSRs)',
  gk_info_li2: 'Descifrar datos cifrados con la clave pública correspondiente',
  gk_info_li3: 'Crear firmas digitales para autenticación',
  gk_security_warning: 'Seguridad: ¡Nunca comparta su clave privada! Manténgala segura y haga copias de seguridad en lugares protegidos.',
  gk_import_title: 'Importar Claves Existentes',
  gk_import_desc: 'Si ya tiene una clave privada y desea importarla, asegúrese de que no esté protegida por contraseña. Para eliminar la contraseña de una clave privada:',
  gk_import_note: 'Se le pedirá la contraseña actual de la clave. El archivo resultante no tendrá contraseña.',
  gk_err_gen: 'Error al generar clave privada',
  gk_success_gen: '¡Clave privada generada con éxito!',
  gk_success_dl: '¡Descarga iniciada!',
  gk_err_dl: 'Error al descargar',
  fp_title: 'Cambio de Contraseña Obligatorio',
  fp_first_access: 'Primer acceso detectado',
  fp_first_access_desc: 'Por seguridad, debe establecer una nueva contraseña antes de continuar. La contraseña predeterminada es conocida y representa un riesgo crítico.',
  fp_security_title: 'Recomendaciones de Seguridad para Cuenta Maestra',
  fp_tip1: 'Use al menos 12 caracteres con letras, números y símbolos.',
  fp_tip2: 'No reutilice contraseñas de otros sistemas o servicios.',
  fp_tip3: 'Almacene la contraseña en un gestor de contraseñas corporativo.',
  fp_tip4: 'Nunca comparta las credenciales de administrador.',
  fp_tip5: 'Esta cuenta tiene acceso a todos los certificados y usuarios del sistema.',
  fp_tip6: 'Si sospecha un compromiso, cambie la contraseña inmediatamente y notifique al equipo de seguridad.',
  fp_current_pwd: 'Contraseña Actual',
  fp_new_pwd: 'Nueva Contraseña',
  fp_confirm_pwd: 'Confirmar Nueva Contraseña',
  fp_strength: 'Fuerza de la contraseña',
  fp_weak: 'Débil',
  fp_fair: 'Regular',
  fp_good: 'Buena',
  fp_strong: 'Fuerte',
  fp_mismatch: 'Las contraseñas no coinciden.',
  fp_fill_all: 'Complete todos los campos.',
  fp_mismatch_err: 'Las contraseñas no coinciden.',
  fp_min_8: 'La contraseña debe tener al menos 8 caracteres.',
  fp_too_weak: 'Elija una contraseña más fuerte.',
  fp_changing: 'Cambiando...',
  fp_set_btn: 'Establecer Nueva Contraseña y Continuar',
  fp_success: '¡Contraseña cambiada con éxito! Bienvenido al SSL Manager.',
  fp_err: 'Error al cambiar contraseña.',
  csr_title: 'Generar CSR',
  csr_subtitle: 'Genere un Certificate Signing Request (CSR) para solicitar un certificado SSL/TLS a una Autoridad Certificadora.',
  csr_cn_label: 'Common Name (dominio)',
  csr_cn_required: 'El Common Name es obligatorio',
  csr_country_label: 'País (código 2 letras)',
  csr_country_required: 'El país es obligatorio',
  csr_state_label: 'Estado / Provincia',
  csr_state_required: 'El estado es obligatorio',
  csr_locality_label: 'Ciudad',
  csr_locality_required: 'La ciudad es obligatoria',
  csr_org_label: 'Organización',
  csr_org_required: 'La organización es obligatoria',
  csr_ou_label: 'Unidad Organizacional',
  csr_email_label: 'Correo electrónico',
  csr_wildcard_label: 'Certificado Wildcard (*.dominio.com)',
  csr_wildcard_hint: 'Un certificado wildcard cubre todos los subdominios de un dominio.',
  csr_san_label: 'Subject Alternative Names (SANs)',
  csr_san_placeholder: 'Ingrese un dominio y presione Enter',
  csr_san_include_cn: 'Incluir Common Name en los SANs',
  csr_key_type_label: 'Tipo de Clave',
  csr_key_size_label: 'Tamaño / Curva',
  csr_custom_name_label: 'Nombre del archivo',
  csr_custom_name_required: 'El nombre es obligatorio',
  csr_name_pattern: 'Use solo letras, números, _ y -',
  csr_desc_label: 'Descripción',
  csr_tag_placeholder: 'Escriba una etiqueta y presione Enter',
  csr_generating: 'Generando...',
  csr_generate_btn: 'Generar CSR',
  csr_success_title: '¡CSR generado con éxito!',
  csr_copy_csr: 'Copiar CSR',
  csr_csr_copied: '¡CSR copiado!',
  csr_key_generated: 'Se generó automáticamente una clave privada.',
  csr_key_label: 'Clave privada generada:',
  csr_info_section: '¿Qué es un CSR?',
  csr_err_gen: 'Error al generar CSR',
  csr_success_gen: '¡CSR generado con éxito!',
  csr_err_dl: 'Error al descargar',
  csr_success_dl: '¡Descarga iniciada!',
  ssh_title: 'Claves SSH',
  ssh_subtitle: 'Gestione y genere pares de claves SSH para acceso seguro a servidores.',
  ssh_key_name_label: 'Nombre de la clave',
  ssh_key_name_required: 'El nombre es obligatorio',
  ssh_key_type_label: 'Tipo de clave',
  ssh_key_size_label: 'Tamaño',
  ssh_comment_label: 'Comentario (opcional)',
  ssh_generating: 'Generando...',
  ssh_generate_btn: 'Generar Par de Claves SSH',
  ssh_success_title: '¡Par de claves SSH generado con éxito!',
  ssh_pub_key_label: 'Clave Pública',
  ssh_priv_key_label: 'Clave Privada',
  ssh_copy_pub: 'Copiar clave pública',
  ssh_copy_priv: 'Copiar clave privada',
  ssh_pub_copied: '¡Clave pública copiada!',
  ssh_priv_copied: '¡Clave privada copiada!',
  ssh_download_pub: 'Descargar clave pública',
  ssh_download_priv: 'Descargar clave privada',
  ssh_warning: '¡Nunca comparta su clave privada SSH!',
  ssh_err_gen: 'Error al generar claves SSH',
  ssh_err_load: 'Error al cargar claves SSH',
  ssh_delete_confirm: '¿Está seguro de que desea eliminar esta clave SSH?',
  ssh_delete_success: 'Clave SSH eliminada con éxito.',
  ssh_err_delete: 'Error al eliminar clave SSH',
  val_title: 'Validar Archivos',
  val_subtitle: 'Valide certificados, claves privadas y otros archivos SSL/TLS.',
  val_mode_upload: 'Subir archivo',
  val_mode_existing: 'Archivo existente',
  val_upload_hint: 'Arrastre y suelte o haga clic para seleccionar',
  val_file_type_label: 'Tipo de archivo',
  val_file_all: 'Todos',
  val_pfx_pwd_label: 'Contraseña del PFX',
  val_validate_btn: 'Validar',
  val_validating: 'Validando...',
  val_result_title: 'Resultado de Validación',
  val_valid: 'Válido',
  val_invalid: 'Inválido',
  val_cert_details: 'Detalles del certificado',
  val_err_load: 'Error al cargar archivos',
  val_err_validate: 'Error al validar archivo',
  val_no_file: 'Seleccione un archivo para validar',
  val_cert_match: 'El certificado y la clave privada coinciden',
  val_cert_no_match: 'El certificado y la clave privada NO coinciden',
  forgot_title: 'Recuperar Contraseña',
  forgot_subtitle: 'Ingrese su correo para recibir las instrucciones de recuperación de contraseña.',
  forgot_email_label: 'Correo electrónico',
  forgot_send_btn: 'Enviar',
  forgot_sending: 'Enviando...',
  forgot_success: 'Si el correo está registrado, recibirá las instrucciones en breve.',
  forgot_back_login: 'Volver al inicio de sesión',
  forgot_err: 'Error al enviar correo',
  upload_title: 'Importar Archivo',
  upload_drop_hint: 'Arrastre y suelte el archivo aquí, o haga clic para seleccionar',
  upload_select_type: 'Tipo de archivo',
  upload_type_required: 'Seleccione el tipo de archivo',
  upload_custom_name: 'Nombre personalizado',
  upload_custom_name_required: 'El nombre es obligatorio',
  upload_name_pattern: 'Use solo letras, números, _ y -',
  upload_desc: 'Descripción (opcional)',
  upload_tag_placeholder: 'Escriba una etiqueta y presione Enter',
  upload_uploading: 'Subiendo...',
  upload_btn: 'Importar',
  upload_success: '¡Archivo importado con éxito!',
  upload_err: 'Error al importar archivo',
  upload_no_file: 'Seleccione un archivo para importar',
  acd_title: 'Documentación: Autenticación Server-to-Server (mTLS)',
  acd_subtitle: 'Guía definitiva para desarrolladores sobre cómo utilizar certificados para garantizar seguridad en la comunicación entre microservicios.',
  acd_back_btn: 'Volver a Certificados',
  acd_mtls_title: '1. ¿Qué es mTLS (Mutual TLS)?',
  acd_fields_title: '2. ¿Para qué sirven los campos de generación?',
  acd_nginx_title: '3. Cómo configurar NGINX / API Gateway',
  forgot_step1: 'Identificación',
  forgot_step2: 'Pregunta de Seguridad',
  forgot_step3: 'Nueva Contraseña',
  forgot_username_label: 'Nombre de usuario',
  forgot_checking: 'Verificando...',
  forgot_continue: 'Continuar',
  forgot_security_answer_label: 'Respuesta de Seguridad',
  forgot_answer_helper: 'Escriba exactamente como la registró (no distingue mayúsculas)',
  forgot_changing: 'Cambiando contraseña...',
  forgot_change_btn: 'Cambiar Contraseña',
  forgot_user_not_found: 'Usuario no encontrado',
  forgot_wrong_answer: 'Respuesta de seguridad incorrecta',
  forgot_reset_err: 'Error al restablecer contraseña',
  cpd_min_err: 'La nueva contraseña debe tener al menos 6 caracteres',
  cpd_min_chars: 'Mínimo 6 caracteres',
  cpd_changing: 'Cambiando...',
  cpd_change_btn: 'Cambiar',
  ssh_passphrase_title: 'Proteger con Passphrase',
  ssh_passphrase_on: 'Activado',
  ssh_passphrase_off: 'Desactivado',
  ssh_no_passphrase_alert_title: 'Atención — clave sin protección',
  ssh_no_passphrase_alert_desc: 'Sin passphrase, cualquier persona con acceso al archivo de la clave privada podrá usarla inmediatamente. Use esta opción solo en entornos CI/CD o cuando la gestión de contraseñas no sea viable.',
  ssh_confirm_passphrase_label: 'Confirmar Passphrase',
  ssh_passphrase_mismatch: 'Las passphrases no coinciden',
  ssh_my_keys_title: 'Mis Claves SSH',
  ssh_no_keys_msg: 'Ninguna clave SSH generada aún.',
  ssh_col_comment: 'Comentario',
  ssh_col_passphrase: 'Passphrase',
  ssh_col_created: 'Creado el',
  ssh_delete_dialog_title: 'Eliminar Clave SSH',
  ssh_delete_irreversible_msg: 'Esta acción es irreversible. El archivo de la clave privada será eliminado del disco.',
  ssh_removing: 'Eliminando...',
  csr_cert_info_title: 'Información del Certificado',
  csr_file_id_title: 'Identificación del Archivo',
  csr_invalid_domain: 'Formato de dominio inválido',
  val_file_selected_prefix: 'Archivo seleccionado:',
  val_accepted_formats: 'Formatos aceptados: .pem, .key, .crt, .cer, .csr, .pfx, .p12',
  val_pfx_loading_pwd: 'Cargando contraseña...',
  upload_csr_err: 'El CSR debe ser generado por la plataforma, no importado',
  upload_pfx_err: 'El PFX debe ser generado por la plataforma, no importado',
  upload_encrypted_key_err: 'Esta clave privada está protegida por contraseña. Elimine la contraseña antes de importar.',
  login_subtitle: 'Inicie sesión para acceder al gestor',
  login_username: 'Usuario',
  login_username_required: 'El usuario es obligatorio',
  login_password: 'Contraseña',
  login_password_required: 'La contraseña es obligatoria',
  login_sign_in: 'Iniciar Sesión',
  login_signing_in: 'Iniciando sesión...',
  login_error: 'Usuario o contraseña inválidos',
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
