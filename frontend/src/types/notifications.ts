// Bildirim tipleri

export interface Notification {
  id: number;
  recipient: number;
  recipient_name?: string;
  title: string;
  message: string;
  notification_type: 'reminder' | 'event' | 'event_updated' | 'email' | 'task' | 'system' | 'info' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  content_type?: number | null;
  object_id?: number | null;
  content_object_str?: string | null;
  is_read: boolean;
  is_sent: boolean;
  read_at?: string | null;
  sent_at?: string | null;
  action_url?: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationList {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  is_read: boolean;
  read_at?: string | null;
  action_url?: string | null;
  created_at: string;
}

export interface NotificationCreate {
  title: string;
  message: string;
  notification_type: 'reminder' | 'event' | 'event_updated' | 'email' | 'task' | 'system' | 'info' | 'warning' | 'error';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  content_type?: number | null;
  object_id?: number | null;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  id: number;
  user: number;
  user_name?: string;
  email_reminders: boolean;
  email_events: boolean;
  email_tasks: boolean;
  email_system: boolean;
  web_reminders: boolean;
  web_events: boolean;
  web_tasks: boolean;
  web_system: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferenceUpdate {
  email_reminders?: boolean;
  email_events?: boolean;
  email_tasks?: boolean;
  email_system?: boolean;
  web_reminders?: boolean;
  web_events?: boolean;
  web_tasks?: boolean;
  web_system?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
}

export interface BulkNotificationCreate {
  recipient_ids: number[];
  title: string;
  message: string;
  notification_type: 'reminder' | 'event' | 'event_updated' | 'email' | 'task' | 'system' | 'info' | 'warning' | 'error';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface NotificationStats {
  unread_count: number;
  total_count: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

// Notification type choices for forms
export const NOTIFICATION_TYPE_CHOICES = [
  { value: 'reminder', label: 'Hatırlatma' },
  { value: 'event', label: 'Etkinlik' },
  { value: 'event_updated', label: 'Hatırlatma' },
  { value: 'email', label: 'E-posta' },
  { value: 'task', label: 'Görev' },
  { value: 'system', label: 'Sistem' },
  { value: 'info', label: 'Bilgi' },
  { value: 'warning', label: 'Uyarı' },
  { value: 'error', label: 'Hata' },
];

export const NOTIFICATION_PRIORITY_CHOICES = [
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
  { value: 'urgent', label: 'Acil' },
];

// Notification context for real-time updates
export interface NotificationContext {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: number) => void;
  refreshNotifications: () => void;
}
