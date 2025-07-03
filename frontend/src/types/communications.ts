// İletişim tipleri
export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  variables: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EmailMessage {
  id: number;
  subject: string;
  content: string;
  sender: string;
  recipients: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  status: 'draft' | 'sending' | 'sent' | 'failed';
  error_message?: string;
  company?: number;
  company_name?: string;
  contact?: number;
  contact_name?: string;
  opportunity?: number;
  opportunity_title?: string;
  created_at: string;
  sent_at?: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailConfig {
  id: number;
  name: string;
  smtp_server: string;
  smtp_port: number;
  use_tls: boolean;
  email_address: string;
  display_name?: string;
  username: string;
  password: string;
  is_active: boolean;
  is_default: boolean;
}

export interface SendEmailRequest {
  subject: string;
  content: string;
  recipients: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  template_id?: number;
  company_id?: number;
  contact_id?: number;
  opportunity_id?: number;
  config_id?: number;
}

export interface ImapSettings {
  imap_server: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  use_ssl: boolean;
}

export interface IncomingEmail {
  id: number;
  message_id: string;
  subject: string;
  content: string;
  content_html?: string;
  sender_email: string;
  sender_name?: string;
  sender_display: string;
  recipients: EmailRecipient[];
  cc?: EmailRecipient[];
  company?: number;
  company_name?: string;
  contact?: number;
  contact_name?: string;
  status: 'unread' | 'read' | 'archived' | 'deleted';
  received_at: string;
  created_at: string;
  updated_at: string;
  has_attachments: boolean;
  attachments?: any[];
  recipients_count: number;
}
