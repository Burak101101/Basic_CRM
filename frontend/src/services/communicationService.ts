import apiClient from './apiClient';
import { 
  EmailTemplate, 
  EmailMessage, 
  EmailConfig, 
  SendEmailRequest 
} from '../types/communications';

// E-posta şablonları için API çağrıları
const TEMPLATES_URL = '/api/v1/communications/email-templates/';

// E-posta şablonlarını getir
export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  try {
    const response = await apiClient.get(TEMPLATES_URL);
    return response.data;
  } catch (error) {
    console.error("Template fetch error:", error);
    return [];
  }
};

// Belirli bir e-posta şablonunu getir
export const getEmailTemplateById = async (id: number): Promise<EmailTemplate> => {
  const response = await apiClient.get(`${TEMPLATES_URL}${id}/`);
  return response.data;
};

// Yeni e-posta şablonu oluştur
export const createEmailTemplate = async (template: Partial<EmailTemplate>): Promise<EmailTemplate> => {
  try {
    console.log("Creating template with URL:", TEMPLATES_URL);
    const response = await apiClient.post(TEMPLATES_URL, template);
    return response.data;
  } catch (error) {
    console.error("Template creation error:", error);
    throw error;
  }
};

// E-posta şablonunu güncelle
export const updateEmailTemplate = async (id: number, template: Partial<EmailTemplate>): Promise<EmailTemplate> => {
  const response = await apiClient.patch(`${TEMPLATES_URL}${id}/`, template);
  return response.data;
};

// E-posta şablonunu sil
export const deleteEmailTemplate = async (id: number): Promise<void> => {
  await apiClient.delete(`${TEMPLATES_URL}${id}/`);
};

// E-posta mesajları için API çağrıları
const EMAILS_URL = '/api/v1/communications/messages/';

// E-postaları getir
export const getEmails = async (status?: string): Promise<EmailMessage[]> => {
  const url = status ? `${EMAILS_URL}?status=${status}` : EMAILS_URL;
  const response = await apiClient.get(url);
  return response.data;
};

// Belirli bir e-postayı getir
export const getEmailById = async (id: number): Promise<EmailMessage> => {
  const response = await apiClient.get(`${EMAILS_URL}${id}/`);
  return response.data;
};

// E-posta gönder
export const sendEmail = async (emailData: SendEmailRequest): Promise<EmailMessage> => {
  const response = await apiClient.post(`${EMAILS_URL}send/`, emailData);
  return response.data;
};

// Taslak e-posta kaydet
export const saveDraft = async (emailData: Partial<SendEmailRequest>): Promise<EmailMessage> => {
  const response = await apiClient.post(`${EMAILS_URL}drafts/`, emailData);
  return response.data;
};

// Taslak e-postayı güncelle
export const updateDraft = async (id: number, emailData: Partial<SendEmailRequest>): Promise<EmailMessage> => {
  const response = await apiClient.patch(`${EMAILS_URL}drafts/${id}/`, emailData);
  return response.data;
};

// Taslak e-postayı gönder
export const sendDraft = async (id: number): Promise<EmailMessage> => {
  const response = await apiClient.post(`${EMAILS_URL}drafts/${id}/send/`, {});
  return response.data;
};

// E-posta ayarları için API çağrıları
const CONFIGS_URL = '/communications/email-configs/';

// E-posta ayarlarını getir
export const getEmailConfigs = async (): Promise<EmailConfig[]> => {
  const response = await apiClient.get(CONFIGS_URL);
  return response.data;
};

// Belirli bir e-posta ayarını getir
export const getEmailConfigById = async (id: number): Promise<EmailConfig> => {
  const response = await apiClient.get(`${CONFIGS_URL}${id}/`);
  return response.data;
};

// Yeni e-posta ayarı oluştur
export const createEmailConfig = async (config: Partial<EmailConfig>): Promise<EmailConfig> => {
  const response = await apiClient.post(CONFIGS_URL, config);
  return response.data;
};

// E-posta ayarını güncelle
export const updateEmailConfig = async (id: number, config: Partial<EmailConfig>): Promise<EmailConfig> => {
  const response = await apiClient.patch(`${CONFIGS_URL}${id}/`, config);
  return response.data;
};

// E-posta ayarını sil
export const deleteEmailConfig = async (id: number): Promise<void> => {
  await apiClient.delete(`${CONFIGS_URL}${id}/`);
};

// E-posta ayarını test et
export const testEmailConfig = async (id: number): Promise<{ success: boolean, message?: string }> => {
  const response = await apiClient.post(`${CONFIGS_URL}${id}/test/`, {});
  return response.data;
};

// Varsayılan e-posta ayarını ayarla
export const setDefaultEmailConfig = async (id: number): Promise<EmailConfig> => {
  const response = await apiClient.post(`${CONFIGS_URL}${id}/set-default/`, {});
  return response.data;
};

// Test e-postalarını görüntüleme (sadece geliştirme ortamında çalışır)
export const getTestEmails = async (): Promise<any[]> => {
  const response = await apiClient.get(`${EMAILS_URL}test-emails/`);
  return response.data;
};

export const getTestEmailDetail = async (id: string): Promise<any> => {
  const response = await apiClient.get(`${EMAILS_URL}${id}/test-email/`);
  return response.data;
};
