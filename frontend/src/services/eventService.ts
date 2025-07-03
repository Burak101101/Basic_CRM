import apiClient from './apiClient';
import { Event, EventList, EventCreate, EventUpdate, EventParticipant, EventParticipantCreate, EventParticipantUpdate } from '../types/events';

const EVENTS_URL = '/api/v1/events/events/';
const PARTICIPANTS_URL = '/api/v1/events/participants/';

// Event API calls

// Tüm etkinlikleri getir
export const getEvents = async (): Promise<EventList[]> => {
  const response = await apiClient.get(EVENTS_URL);
  return response.data;
};

// Belirli bir etkinliğin detaylarını getir
export const getEventById = async (id: number): Promise<Event> => {
  const response = await apiClient.get(`${EVENTS_URL}${id}/`);
  return response.data;
};

// Yeni etkinlik oluştur
export const createEvent = async (event: EventCreate): Promise<Event> => {
  const response = await apiClient.post(EVENTS_URL, event);
  return response.data;
};

// Etkinlik güncelle
export const updateEvent = async (id: number, event: EventUpdate): Promise<Event> => {
  const response = await apiClient.patch(`${EVENTS_URL}${id}/`, event);
  return response.data;
};

// Etkinlik sil
export const deleteEvent = async (id: number): Promise<void> => {
  await apiClient.delete(`${EVENTS_URL}${id}/`);
};

// Yaklaşan etkinlikleri getir
export const getUpcomingEvents = async (): Promise<EventList[]> => {
  const response = await apiClient.get(`${EVENTS_URL}upcoming/`);
  return response.data;
};

// Bugünkü etkinlikleri getir
export const getTodayEvents = async (): Promise<EventList[]> => {
  const response = await apiClient.get(`${EVENTS_URL}today/`);
  return response.data;
};

// Bu haftaki etkinlikleri getir
export const getThisWeekEvents = async (): Promise<EventList[]> => {
  const response = await apiClient.get(`${EVENTS_URL}this_week/`);
  return response.data;
};

// Firma ile ilişkili etkinlikleri getir
export const getCompanyEvents = async (companyId: number): Promise<EventList[]> => {
  const response = await apiClient.get(`${EVENTS_URL}company_events/?company_id=${companyId}`);
  return response.data;
};

// Kişi ile ilişkili etkinlikleri getir
export const getContactEvents = async (contactId: number): Promise<EventList[]> => {
  const response = await apiClient.get(`${EVENTS_URL}contact_events/?contact_id=${contactId}`);
  return response.data;
};

// Etkinliği tamamla
export const completeEvent = async (id: number, outcome?: string): Promise<Event> => {
  const response = await apiClient.post(`${EVENTS_URL}${id}/complete/`, { outcome });
  return response.data;
};

// Etkinliği iptal et
export const cancelEvent = async (id: number, reason?: string): Promise<Event> => {
  const response = await apiClient.post(`${EVENTS_URL}${id}/cancel/`, { reason });
  return response.data;
};

// Event Participant API calls

// Tüm katılımcıları getir
export const getEventParticipants = async (): Promise<EventParticipant[]> => {
  const response = await apiClient.get(PARTICIPANTS_URL);
  return response.data;
};

// Belirli bir etkinliğin katılımcılarını getir
export const getEventParticipantsByEvent = async (eventId: number): Promise<EventParticipant[]> => {
  const response = await apiClient.get(`${PARTICIPANTS_URL}event_participants/?event_id=${eventId}`);
  return response.data;
};

// Belirli bir katılımcının detaylarını getir
export const getEventParticipantById = async (id: number): Promise<EventParticipant> => {
  const response = await apiClient.get(`${PARTICIPANTS_URL}${id}/`);
  return response.data;
};

// Yeni katılımcı ekle
export const createEventParticipant = async (participant: EventParticipantCreate): Promise<EventParticipant> => {
  const response = await apiClient.post(PARTICIPANTS_URL, participant);
  return response.data;
};

// Katılımcı güncelle
export const updateEventParticipant = async (id: number, participant: EventParticipantUpdate): Promise<EventParticipant> => {
  const response = await apiClient.patch(`${PARTICIPANTS_URL}${id}/`, participant);
  return response.data;
};

// Katılımcı sil
export const deleteEventParticipant = async (id: number): Promise<void> => {
  await apiClient.delete(`${PARTICIPANTS_URL}${id}/`);
};

// Katılımcıyı katıldı olarak işaretle
export const markParticipantAttended = async (id: number): Promise<EventParticipant> => {
  const response = await apiClient.post(`${PARTICIPANTS_URL}${id}/mark_attended/`);
  return response.data;
};

// Katılımcıyı gelmedi olarak işaretle
export const markParticipantNoShow = async (id: number): Promise<EventParticipant> => {
  const response = await apiClient.post(`${PARTICIPANTS_URL}${id}/mark_no_show/`);
  return response.data;
};

// Utility functions

// Etkinlik tipini Türkçe'ye çevir
export const getEventTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    'meeting': 'Toplantı',
    'call': 'Telefon Görüşmesi',
    'email': 'E-posta İletişimi',
    'visit': 'Ziyaret',
    'presentation': 'Sunum',
    'demo': 'Demo',
    'follow_up': 'Takip',
    'other': 'Diğer',
  };
  return typeMap[type] || type;
};

// Etkinlik durumunu Türkçe'ye çevir
export const getEventStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'scheduled': 'Planlandı',
    'in_progress': 'Devam Ediyor',
    'completed': 'Tamamlandı',
    'cancelled': 'İptal Edildi',
    'postponed': 'Ertelendi',
  };
  return statusMap[status] || status;
};

// Etkinlik önceliğini Türkçe'ye çevir
export const getEventPriorityLabel = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'low': 'Düşük',
    'medium': 'Orta',
    'high': 'Yüksek',
    'urgent': 'Acil',
  };
  return priorityMap[priority] || priority;
};

// Katılımcı durumunu Türkçe'ye çevir
export const getParticipantStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'invited': 'Davet Edildi',
    'accepted': 'Kabul Etti',
    'declined': 'Reddetti',
    'tentative': 'Belirsiz',
    'attended': 'Katıldı',
    'no_show': 'Gelmedi',
  };
  return statusMap[status] || status;
};
