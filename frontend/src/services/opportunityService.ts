import apiClient from './apiClient';
import { 
  OpportunityStatus, 
  OpportunityList, 
  OpportunityDetail, 
  OpportunityCreate,
  OpportunityActivity,
  OpportunityActivityCreate,
  KanbanColumn
} from '../types/opportunities';

const OPPORTUNITIES_URL = '/api/v1/opportunities/opportunities/';
const STATUSES_URL = '/api/v1/opportunities/statuses/';
const ACTIVITIES_URL = '/api/v1/opportunities/activities/';

// Fırsat durumlarını getir
export const getOpportunityStatuses = async (): Promise<OpportunityStatus[]> => {
  const response = await apiClient.get(STATUSES_URL);
  return response.data;
};

// Tüm fırsatları getir
export const getOpportunities = async (): Promise<OpportunityList[]> => {
  const response = await apiClient.get(OPPORTUNITIES_URL);
  return response.data;
};

// Kanban formatında fırsatları getir
export const getOpportunitiesKanban = async (): Promise<KanbanColumn[]> => {
  const response = await apiClient.get(`${OPPORTUNITIES_URL}kanban/`);
  return response.data;
};

// Fırsatları ara
export const searchOpportunities = async (query: string): Promise<OpportunityList[]> => {
  const response = await apiClient.get(`${OPPORTUNITIES_URL}search/?q=${query}`);
  return response.data;
};

// Belirli bir fırsatın detaylarını getir
export const getOpportunityById = async (id: number): Promise<OpportunityDetail> => {
  const response = await apiClient.get(`${OPPORTUNITIES_URL}${id}/`);
  return response.data;
};

// Yeni fırsat oluştur
export const createOpportunity = async (opportunity: OpportunityCreate): Promise<OpportunityDetail> => {
  const response = await apiClient.post(OPPORTUNITIES_URL, opportunity);
  return response.data;
};

// Fırsat güncelle
export const updateOpportunity = async (id: number, opportunity: Partial<OpportunityCreate>): Promise<OpportunityDetail> => {
  const response = await apiClient.patch(`${OPPORTUNITIES_URL}${id}/`, opportunity);
  return response.data;
};

// Fırsat sil
export const deleteOpportunity = async (id: number): Promise<void> => {
  await apiClient.delete(`${OPPORTUNITIES_URL}${id}/`);
};

// Fırsat durumunu değiştir
export const changeOpportunityStatus = async (id: number, statusId: number): Promise<OpportunityDetail> => {
  const response = await apiClient.post(`${OPPORTUNITIES_URL}${id}/change_status/`, { status_id: statusId });
  return response.data;
};

// Fırsat aktivitesi ekle
export const addOpportunityActivity = async (activity: OpportunityActivityCreate): Promise<OpportunityActivity> => {
  const response = await apiClient.post(ACTIVITIES_URL, activity);
  return response.data;
};

// Firma ilişkili fırsatları getir
export const getCompanyOpportunities = async (companyId: number): Promise<OpportunityList[]> => {
  const response = await apiClient.get(`${OPPORTUNITIES_URL}?company=${companyId}`);
  return response.data;
};

// Kişi ilişkili fırsatları getir
export const getContactOpportunities = async (contactId: number): Promise<OpportunityList[]> => {
  const response = await apiClient.get(`${OPPORTUNITIES_URL}?contact=${contactId}`);
  return response.data;
};
