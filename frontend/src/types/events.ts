// Etkinlik tipleri

export interface Event {
  id: number;
  title: string;
  description?: string | null;
  event_type: 'meeting' | 'call' | 'email' | 'visit' | 'presentation' | 'demo' | 'follow_up' | 'other';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  company?: number | null;
  company_name?: string | null;
  contacts: number[];
  contacts_details?: ContactDetail[];
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  start_datetime: string;
  end_datetime?: string | null;
  reminder_datetime?: string | null;
  is_reminder_sent: boolean;
  location?: string | null;
  meeting_url?: string | null;
  notes?: string | null;
  outcome?: string | null;
  attachments: any[];
  participants?: EventParticipant[];
  participants_count?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface ContactDetail {
  id: number;
  first_name: string;
  last_name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  company?: number | null;
}

export interface EventParticipant {
  id: number;
  event: number;
  contact: number;
  contact_name?: string;
  contact_email?: string;
  status: 'invited' | 'accepted' | 'declined' | 'tentative' | 'attended' | 'no_show';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventList {
  id: number;
  title: string;
  event_type: string;
  status: string;
  priority: string;
  company?: number | null;
  company_name?: string | null;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  start_datetime: string;
  end_datetime?: string | null;
  location?: string | null;
  participants_count: number;
  created_at: string;
}

export interface EventCreate {
  title: string;
  description?: string;
  event_type: 'meeting' | 'call' | 'email' | 'visit' | 'presentation' | 'demo' | 'follow_up' | 'other';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  company?: number | null;
  contacts?: number[];
  assigned_to?: number | null;
  start_datetime: string;
  end_datetime?: string | null;
  reminder_datetime?: string | null;
  location?: string;
  meeting_url?: string;
  notes?: string;
  attachments?: any[];
}

export interface EventUpdate {
  title?: string;
  description?: string;
  event_type?: 'meeting' | 'call' | 'email' | 'visit' | 'presentation' | 'demo' | 'follow_up' | 'other';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  company?: number | null;
  contacts?: number[];
  assigned_to?: number | null;
  start_datetime?: string;
  end_datetime?: string | null;
  reminder_datetime?: string | null;
  location?: string;
  meeting_url?: string;
  notes?: string;
  outcome?: string;
  attachments?: any[];
}

export interface EventParticipantCreate {
  event: number;
  contact: number;
  status?: 'invited' | 'accepted' | 'declined' | 'tentative' | 'attended' | 'no_show';
  notes?: string;
}

export interface EventParticipantUpdate {
  status?: 'invited' | 'accepted' | 'declined' | 'tentative' | 'attended' | 'no_show';
  notes?: string;
}

// Event type choices for forms
export const EVENT_TYPE_CHOICES = [
  { value: 'meeting', label: 'Toplantı' },
  { value: 'call', label: 'Telefon Görüşmesi' },
  { value: 'email', label: 'E-posta İletişimi' },
  { value: 'visit', label: 'Ziyaret' },
  { value: 'presentation', label: 'Sunum' },
  { value: 'demo', label: 'Demo' },
  { value: 'follow_up', label: 'Takip' },
  { value: 'other', label: 'Diğer' },
];

export const EVENT_STATUS_CHOICES = [
  { value: 'scheduled', label: 'Planlandı' },
  { value: 'in_progress', label: 'Devam Ediyor' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal Edildi' },
  { value: 'postponed', label: 'Ertelendi' },
];

export const EVENT_PRIORITY_CHOICES = [
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
  { value: 'urgent', label: 'Acil' },
];

export const PARTICIPANT_STATUS_CHOICES = [
  { value: 'invited', label: 'Davet Edildi' },
  { value: 'accepted', label: 'Kabul Etti' },
  { value: 'declined', label: 'Reddetti' },
  { value: 'tentative', label: 'Belirsiz' },
  { value: 'attended', label: 'Katıldı' },
  { value: 'no_show', label: 'Gelmedi' },
];
