import axios from 'axios';
import { getAuthToken } from './authService';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface EmailData {
  subject: string;
  content: string;
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  attachments?: File[];
  company_id?: number;
  contact_id?: number;
}

export interface EmailMessage {
  id: number;
  subject: string;
  content: string;
  sender: string;
  recipients: any[];
  cc?: any[];
  bcc?: any[];
  status: 'draft' | 'sending' | 'sent' | 'failed';
  error_message?: string;
  company?: any;
  contact?: any;
  created_at: string;
  sent_at?: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  variables: any;
  created_at: string;
  updated_at: string;
}

export interface UserEmailSettings {
  smtp_server: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  use_tls: boolean;
}

class EmailService {
  private getAuthHeaders() {
    const token = getAuthToken();
    console.log('Auth token:', token);
    return {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getMultipartHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Token ${token}`,
    };
  }

  async sendEmail(emailData: EmailData): Promise<any> {
    try {
      // Önce ekleri yükle
      const attachmentData: any[] = [];
      
      if (emailData.attachments && emailData.attachments.length > 0) {
        for (const file of emailData.attachments) {
          const uploadedAttachment = await this.uploadAttachment(file);
          attachmentData.push({
            file_name: uploadedAttachment.file_name,
            file_content: uploadedAttachment.file_content,
            file_size: uploadedAttachment.file_size,
            content_type: uploadedAttachment.content_type
          });
        }
      }

      // E-posta verilerini hazırla
      const payload = {
        subject: emailData.subject,
        content: emailData.content,
        recipients: emailData.recipients.map(email => ({ email: email.trim() })),
        cc: emailData.cc?.map(email => ({ email: email.trim() })) || [],
        bcc: emailData.bcc?.map(email => ({ email: email.trim() })) || [],
        attachments: attachmentData,
        company_id: emailData.company_id,
        contact_id: emailData.contact_id
        
      };
      console.log("Gönderilen e-posta payload:", payload);
      const response = await axios.post(
        `${API_BASE_URL}/communications/messages/send/`,
        payload,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Email send error:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.details || 
        'E-posta gönderilirken bir hata oluştu'
      );
    }
  }

  async uploadAttachment(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/communications/messages/upload-attachment/`,
        formData,
        { headers: this.getMultipartHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Attachment upload error:', error);
      throw new Error(
        error.response?.data?.error || 
        'Dosya yüklenirken bir hata oluştu'
      );
    }
  }

  async getEmailMessages(params?: {
    company_id?: number;
    contact_id?: number;
    search?: string;
    page?: number;
  }): Promise<{ results: EmailMessage[]; count: number }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.company_id) {
        queryParams.append('company_id', params.company_id.toString());
      }
      if (params?.contact_id) {
        queryParams.append('contact_id', params.contact_id.toString());
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }

      const response = await axios.get(
        `${API_BASE_URL}/communications/messages/?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Get email messages error:', error);
      throw new Error('E-posta mesajları alınırken bir hata oluştu');
    }
  }

  async getEmailMessage(id: number): Promise<EmailMessage> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/communications/messages/${id}/`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Get email message error:', error);
      throw new Error('E-posta mesajı alınırken bir hata oluştu');
    }
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/communications/email-templates/`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.results || response.data;
    } catch (error: any) {
      console.error('Get email templates error:', error);
      throw new Error('E-posta şablonları alınırken bir hata oluştu');
    }
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/communications/email-templates/${id}/`,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Get email template error:', error);
      throw new Error('E-posta şablonu alınırken bir hata oluştu');
    }
  }

  async getUserEmailSettings(): Promise<UserEmailSettings> {
    try {
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Getting user email settings from:', `${API_BASE_URL}/auth/profile/email-settings/`);
      const response = await axios.get(
        `${API_BASE_URL}/auth/profile/email-settings/`,
        { headers: this.getAuthHeaders() }
      );

      console.log('User email settings response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Get user email settings error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error('E-posta ayarları alınırken bir hata oluştu');
    }
  }

  async updateUserEmailSettings(settings: UserEmailSettings): Promise<UserEmailSettings> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/auth/profile/email-settings/`,
        settings,
        { headers: this.getAuthHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Update user email settings error:', error);
      throw new Error(
        error.response?.data?.error || 
        'E-posta ayarları güncellenirken bir hata oluştu'
      );
    }
  }

  async getCompanyEmails(companyId: number): Promise<EmailMessage[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/communications/messages/company_emails/?company_id=${companyId}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.results || response.data;
    } catch (error: any) {
      console.error('Get company emails error:', error);
      throw new Error('Firma e-postaları alınırken bir hata oluştu');
    }
  }

  async getContactEmails(contactId: number): Promise<EmailMessage[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/communications/messages/contact_emails/?contact_id=${contactId}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.results || response.data;
    } catch (error: any) {
      console.error('Get contact emails error:', error);
      throw new Error('Kişi e-postaları alınırken bir hata oluştu');
    }
  }
}

export const emailService = new EmailService();
