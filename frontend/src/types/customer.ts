// Müşteri/İletişim tipleri
export interface CompanyList {
  id: number;
  name: string;
  industry: string | null;
  phone: string | null;
  email: string | null;
  contact_count: number;
}

export interface Company extends CompanyList {
  tax_number: string | null;
  address: string | null;
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
  address?: string;
  phone?: string;
  email?: string;
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
}

export interface ContactCreate {
  company: number;
  first_name: string;
  last_name: string;
  position?: string;
  phone?: string;
  email?: string;
  is_primary?: boolean;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  company: number | null;
  company_name?: string | null;
  contact: number | null;
  contact_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteNested {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}
