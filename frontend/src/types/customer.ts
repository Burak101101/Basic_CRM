// Müşteri/İletişim tipleri
export interface CompanyList {
  id: number;
  name: string;
  industry: string | null;
  company_size: string | null;
  company_size_display: string | null;
  phone: string | null;
  email: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  contact_count: number;
}

export interface Company extends CompanyList {
  tax_number: string | null;
  address: string | null;
  other_links: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CompanyDetail extends Company {
  contacts: ContactNested[];
  notes: NoteNested[];
}

export interface CompanyCreate {
  name: string;
  tax_number?: string;
  industry?: string;
  company_size?: string;
  address?: string;
  phone?: string;
  email?: string;
  linkedin_url?: string;
  website_url?: string;
  other_links?: Record<string, any>;
}

export interface Contact {
  id: number;
  company: number;
  company_name?: string;
  first_name: string;
  last_name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  lead_source: string | null;
  lead_source_display: string | null;
  lead_status: string;
  lead_status_display: string | null;
  linkedin_url: string | null;
  personal_website: string | null;
  other_links: Record<string, any>;
  created_at: string;
  updated_at: string;
  notes: NoteNested[];
}

export interface ContactNested {
  id: number;
  first_name: string;
  last_name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  lead_status: string;
  lead_status_display: string | null;
  linkedin_url: string | null;
}

export interface ContactCreate {
  company: number;
  first_name: string;
  last_name: string;
  position?: string;
  phone?: string;
  email?: string;
  is_primary?: boolean;
  lead_source?: string;
  lead_status?: string;
  linkedin_url?: string;
  personal_website?: string;
  other_links?: Record<string, any>;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  rich_content?: string | null;
  company: number | null;
  company_name?: string | null;
  contact: number | null;
  contact_name?: string | null;
  note_date?: string | null;
  reminder_date?: string | null;
  is_reminder_sent: boolean;
  attachments: any[];
  created_at: string;
  updated_at: string;
}

export interface NoteNested {
  id: number;
  title: string;
  content: string;
  rich_content?: string | null;
  created_at: string;
  updated_at: string;
}
