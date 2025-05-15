import apiClient from './apiClient';
import { Contact, ContactCreate } from '../types/customer';

const CONTACTS_URL = '/api/v1/customers/contacts/';

// Tüm kişileri getir
export const getContacts = async (): Promise<Contact[]> => {
  const response = await apiClient.get(CONTACTS_URL);
  return response.data;
};

// Belirli bir kişinin detaylarını getir
export const getContactById = async (id: number): Promise<Contact> => {
  const response = await apiClient.get(`${CONTACTS_URL}${id}/`);
  return response.data;
};

// Yeni kişi oluştur
export const createContact = async (contact: ContactCreate): Promise<Contact> => {
  const response = await apiClient.post(CONTACTS_URL, contact);
  return response.data;
};

// Kişi güncelle
export const updateContact = async (id: number, contact: Partial<Contact>): Promise<Contact> => {
  const response = await apiClient.patch(`${CONTACTS_URL}${id}/`, contact);
  return response.data;
};

// Kişi sil
export const deleteContact = async (id: number): Promise<void> => {
  await apiClient.delete(`${CONTACTS_URL}${id}/`);
};

// Kişi arama
export const searchContacts = async (query: string): Promise<Contact[]> => {
  const response = await apiClient.get(`${CONTACTS_URL}search/?q=${encodeURIComponent(query)}`);
  return response.data.contacts || [];
};
