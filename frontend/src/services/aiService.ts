import { apiClient } from './apiClient';

const AI_SERVICE_URL = '/api/v1/ai/';

export interface EmailComposeAIRequest {
  subject?: string;
  company_id?: number;
  contact_id?: number;
  opportunity_id?: number;
  additional_context?: string;
}

export interface EmailReplyAIRequest {
  incoming_email_id: number;
  additional_context?: string;
}

export interface OpportunityAIRequest {
  company_id?: number;
  contact_id?: number;
  additional_context?: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  data?: any;
  error?: string;
  request_id?: number;
}

export interface OpportunityProposal {
  title: string;
  description: string;
  estimated_value: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
}

export interface OpportunityAIResponse {
  opportunities: OpportunityProposal[];
  analysis: string;
}

class AIService {
  /**
   * E-posta içeriği oluştur
   */
  async generateEmailContent(request: EmailComposeAIRequest): Promise<string> {
    try {
      const response = await apiClient.post<AIResponse>(AI_SERVICE_URL + 'email/compose/', request);
      
      if (response.data.success && response.data.content) {
        return response.data.content;
      } else {
        throw new Error(response.data.error || 'AI yanıtı alınamadı');
      }
    } catch (error: any) {
      console.error('AI e-posta içeriği oluşturma hatası:', error);
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'E-posta içeriği oluşturulurken bir hata oluştu'
      );
    }
  }

  /**
   * E-posta yanıtı oluştur
   */
  async generateEmailReply(request: EmailReplyAIRequest): Promise<string> {
    try {
      const response = await apiClient.post<AIResponse>(AI_SERVICE_URL + 'email/reply/', request);
      
      if (response.data.success && response.data.content) {
        return response.data.content;
      } else {
        throw new Error(response.data.error || 'AI yanıtı alınamadı');
      }
    } catch (error: any) {
      console.error('AI e-posta yanıtı oluşturma hatası:', error);
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'E-posta yanıtı oluşturulurken bir hata oluştu'
      );
    }
  }

  /**
   * Fırsat önerisi oluştur
   */
  async generateOpportunityProposal(request: OpportunityAIRequest): Promise<OpportunityAIResponse> {
    try {
      const response = await apiClient.post<AIResponse>(AI_SERVICE_URL + 'opportunity/generate/', request);
      
      if (response.data.success && response.data.data) {
        return response.data.data as OpportunityAIResponse;
      } else {
        throw new Error(response.data.error || 'AI yanıtı alınamadı');
      }
    } catch (error: any) {
      console.error('AI fırsat önerisi oluşturma hatası:', error);
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'Fırsat önerisi oluşturulurken bir hata oluştu'
      );
    }
  }

  /**
   * AI servis durumunu kontrol et
   */
  async checkAIStatus(): Promise<{ success: boolean; status: string; model?: string; provider?: string; error?: string }> {
    try {
      const response = await apiClient.get(AI_SERVICE_URL + 'status/');
      return response.data;
    } catch (error: any) {
      console.error('AI durum kontrolü hatası:', error);
      return {
        success: false,
        status: 'error',
        error: error.response?.data?.error || error.message || 'AI servis durumu kontrol edilemedi'
      };
    }
  }

  /**
   * AI isteklerini listele
   */
  async getAIRequests(): Promise<any[]> {
    try {
      const response = await apiClient.get(AI_SERVICE_URL + 'requests/');
      return response.data.requests || [];
    } catch (error: any) {
      console.error('AI istekleri listeleme hatası:', error);
      throw new Error(
        error.response?.data?.error || 
        error.message || 
        'AI istekleri listelenemedi'
      );
    }
  }
}

export const aiService = new AIService();
