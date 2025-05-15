import apiClient from './apiClient';
import { Company, CompanyCreate, CompanyList, CompanyDetail } from '../types/customer';

const COMPANIES_URL = '/api/v1/customers/companies/';

// Tüm şirketleri getir
export const getCompanies = async (): Promise<CompanyList[]> => {
  const response = await apiClient.get(COMPANIES_URL);
  return response.data;
};

// Belirli bir şirketin detaylarını getir
export const getCompanyById = async (id: number): Promise<CompanyDetail> => {
  const response = await apiClient.get(`${COMPANIES_URL}${id}/`);
  return response.data;
};

// Yeni şirket oluştur
export const createCompany = async (company: CompanyCreate): Promise<Company> => {
  const response = await apiClient.post(COMPANIES_URL, company);
  return response.data;
};

// Şirket güncelle
export const updateCompany = async (id: number, company: Partial<Company>): Promise<Company> => {
  const response = await apiClient.patch(`${COMPANIES_URL}${id}/`, company);
  return response.data;
};

// Şirket sil
export const deleteCompany = async (id: number): Promise<void> => {
  await apiClient.delete(`${COMPANIES_URL}${id}/`);
};

// Şirket arama
export const searchCompanies = async (query: string): Promise<CompanyList[]> => {
  const response = await apiClient.get(`${COMPANIES_URL}search/?q=${encodeURIComponent(query)}`);
  return response.data.companies || [];
};

// Şirketin iletişim kişilerini getir
export const getCompanyContacts = async (companyId: number) => {
  const response = await apiClient.get(`${COMPANIES_URL}${companyId}/contacts/`);
  return response.data;
};
