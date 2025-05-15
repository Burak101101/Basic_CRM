import apiClient from './apiClient';
import { Note } from '../types/customer';

const NOTES_URL = '/api/v1/customers/notes/';

// Tüm notları getir
export const getNotes = async (): Promise<Note[]> => {
  const response = await apiClient.get(NOTES_URL);
  return response.data;
};

// Belirli bir notun detaylarını getir
export const getNoteById = async (id: number): Promise<Note> => {
  const response = await apiClient.get(`${NOTES_URL}${id}/`);
  return response.data;
};

// Yeni not oluştur
export const createNote = async (note: Partial<Note>): Promise<Note> => {
  const response = await apiClient.post(NOTES_URL, note);
  return response.data;
};

// Not güncelle
export const updateNote = async (id: number, note: Partial<Note>): Promise<Note> => {
  const response = await apiClient.patch(`${NOTES_URL}${id}/`, note);
  return response.data;
};

// Not sil
export const deleteNote = async (id: number): Promise<void> => {
  await apiClient.delete(`${NOTES_URL}${id}/`);
};

// Firma veya kişi ile ilişkili notları getir
export const getRelatedNotes = async (entityType: 'company' | 'contact', entityId: number): Promise<Note[]> => {
  const response = await apiClient.get(`${NOTES_URL}?${entityType}=${entityId}`);
  return response.data;
};
