import apiClient from './apiClient';
import {
  Notification,
  NotificationList,
  NotificationCreate,
  NotificationPreference,
  NotificationPreferenceUpdate,
  BulkNotificationCreate
} from '../types/notifications';

const NOTIFICATIONS_URL = '/api/v1/notifications/notifications/';
const PREFERENCES_URL = '/api/v1/notifications/preferences/';

// Notification API calls

// Tüm bildirimleri getir (kullanıcının kendi bildirimleri)
export const getNotifications = async (): Promise<NotificationList[]> => {
  const response = await apiClient.get(NOTIFICATIONS_URL);
  return response.data;
};

// Belirli bir bildirimin detaylarını getir
export const getNotificationById = async (id: number): Promise<Notification> => {
  const response = await apiClient.get(`${NOTIFICATIONS_URL}${id}/`);
  return response.data;
};

// Yeni bildirim oluştur
export const createNotification = async (notification: NotificationCreate): Promise<Notification> => {
  const response = await apiClient.post(NOTIFICATIONS_URL, notification);
  return response.data;
};

// Bildirim güncelle
export const updateNotification = async (id: number, notification: Partial<NotificationCreate>): Promise<Notification> => {
  const response = await apiClient.patch(`${NOTIFICATIONS_URL}${id}/`, notification);
  return response.data;
};

// Bildirim sil
export const deleteNotification = async (id: number): Promise<void> => {
  await apiClient.delete(`${NOTIFICATIONS_URL}${id}/`);
};

// Okunmamış bildirimleri getir
export const getUnreadNotifications = async (): Promise<NotificationList[]> => {
  const response = await apiClient.get(`${NOTIFICATIONS_URL}unread/`);
  return response.data;
};

// Okunmamış bildirim sayısını getir
export const getUnreadNotificationCount = async (): Promise<{ unread_count: number }> => {
  const response = await apiClient.get(`${NOTIFICATIONS_URL}unread_count/`);
  return response.data;
};

// Bildirimi okundu olarak işaretle
export const markNotificationAsRead = async (id: number): Promise<Notification> => {
  const response = await apiClient.post(`${NOTIFICATIONS_URL}${id}/mark_as_read/`);
  return response.data;
};

// Tüm bildirimleri okundu olarak işaretle
export const markAllNotificationsAsRead = async (): Promise<{ message: string }> => {
  const response = await apiClient.post(`${NOTIFICATIONS_URL}mark_all_as_read/`);
  return response.data;
};

// Bildirim tipine göre filtreleme
export const getNotificationsByType = async (type: string): Promise<NotificationList[]> => {
  const response = await apiClient.get(`${NOTIFICATIONS_URL}by_type/?type=${type}`);
  return response.data;
};

// Toplu bildirim oluşturma
export const createBulkNotifications = async (bulkNotification: BulkNotificationCreate): Promise<{ message: string; created_count: number }> => {
  const response = await apiClient.post(`${NOTIFICATIONS_URL}bulk_create/`, bulkNotification);
  return response.data;
};

// Son bildirimleri getir (real-time için)
export const getRecentNotifications = async (limit = 10): Promise<{ notifications: NotificationList[], unread_count: number }> => {
  const response = await apiClient.get(`${NOTIFICATIONS_URL}recent/?limit=${limit}`);
  return response.data;
};

// Bekleyen hatırlatmaları getir
export const getPendingReminders = async (): Promise<{ pending_reminders: NotificationList[] }> => {
  const response = await apiClient.get(`${NOTIFICATIONS_URL}pending_reminders/`);
  return response.data;
};

// Notification Preference API calls

// Kullanıcının bildirim tercihlerini getir
export const getNotificationPreferences = async (): Promise<NotificationPreference> => {
  const response = await apiClient.get(`${PREFERENCES_URL}my_preferences/`);
  return response.data;
};

// Bildirim tercihlerini güncelle
export const updateNotificationPreferences = async (preferences: NotificationPreferenceUpdate): Promise<NotificationPreference> => {
  const response = await apiClient.post(`${PREFERENCES_URL}update_preferences/`, preferences);
  return response.data;
};

// Utility functions

// Bildirim tipini Türkçe'ye çevir
export const getNotificationTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    'reminder': 'Hatırlatma',
    'event': 'Etkinlik',
    'event_updated': 'Hatırlatma',  // "Etkinlik Güncellendi" bildirimini "Hatırlatma" olarak göster
    'email': 'E-posta',
    'task': 'Görev',
    'system': 'Sistem',
    'info': 'Bilgi',
    'warning': 'Uyarı',
    'error': 'Hata',
  };
  return typeMap[type] || type;
};

// Bildirim önceliğini Türkçe'ye çevir
export const getNotificationPriorityLabel = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'low': 'Düşük',
    'medium': 'Orta',
    'high': 'Yüksek',
    'urgent': 'Acil',
  };
  return priorityMap[priority] || priority;
};

// Bildirim tipine göre renk döndür
export const getNotificationTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'reminder': 'bg-blue-100 text-blue-800',
    'event': 'bg-green-100 text-green-800',
    'event_updated': 'bg-blue-100 text-blue-800',  // "Etkinlik Güncellendi" bildirimini "Hatırlatma" gibi mavi renk yap
    'email': 'bg-purple-100 text-purple-800',
    'task': 'bg-yellow-100 text-yellow-800',
    'system': 'bg-gray-100 text-gray-800',
    'info': 'bg-blue-100 text-blue-800',
    'warning': 'bg-orange-100 text-orange-800',
    'error': 'bg-red-100 text-red-800',
  };
  return colorMap[type] || 'bg-gray-100 text-gray-800';
};

// Bildirim önceliğine göre renk döndür
export const getNotificationPriorityColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    'low': 'bg-gray-100 text-gray-800',
    'medium': 'bg-blue-100 text-blue-800',
    'high': 'bg-orange-100 text-orange-800',
    'urgent': 'bg-red-100 text-red-800',
  };
  return colorMap[priority] || 'bg-gray-100 text-gray-800';
};

// Bildirim ikonunu döndür
export const getNotificationTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    'reminder': '⏰',
    'event': '📅',
    'event_updated': '⏰',  // "Etkinlik Güncellendi" bildirimini saat ikonu ile göster (Hatırlatma gibi)
    'email': '📧',
    'task': '✅',
    'system': '⚙️',
    'info': 'ℹ️',
    'warning': '⚠️',
    'error': '❌',
  };
  return iconMap[type] || 'ℹ️';
};

// Tarih formatını düzenle
export const formatNotificationDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return `${diffInMinutes} dakika önce`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} saat önce`;
  } else if (diffInHours < 48) {
    return 'Dün';
  } else {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
};

// Real-time notification handling
export class NotificationManager {
  private static instance: NotificationManager;
  private listeners: ((notification: Notification) => void)[] = [];
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }
  
  addListener(callback: (notification: Notification) => void): void {
    this.listeners.push(callback);
  }
  
  removeListener(callback: (notification: Notification) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  notify(notification: Notification): void {
    this.listeners.forEach(listener => listener(notification));
  }
  
  // Browser notification API
  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: `notification-${notification.id}`,
      });
    }
  }
}
