// Satış fırsatı tipleri
export interface OpportunityStatus {
  id: number;
  name: string;
  description: string | null;
  color: string;
  order: number;
  is_default: boolean;
  is_won: boolean;
  is_lost: boolean;
}

export interface OpportunityActivity {
  id: number;
  opportunity: number;
  type: 'note' | 'call' | 'meeting' | 'email' | 'task';
  type_display?: string;
  title: string;
  description: string;
  performed_by: number;
  performed_by_details?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  performed_at: string;
  created_at: string;
}

export interface OpportunityList {
  id: number;
  title: string;
  company: number;
  company_name: string;
  status: number;
  status_name: string;
  status_color: string;
  value: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  expected_close_date: string;
  assigned_to: number | null;
  assigned_to_name?: string;
  closed_at: string | null;
  is_closed: boolean;
  contact_count: number;
}

export interface OpportunityDetail extends OpportunityList {
  description: string | null;
  contacts: any[]; // ContactNested[] tipinde
  status_details: OpportunityStatus;
  assigned_to_details: any | null; // User tipinde
  activities: OpportunityActivity[];
  created_at: string;
  updated_at: string;
}

export interface OpportunityCreate {
  title: string;
  description?: string;
  company: number;
  contacts?: number[];
  status: number;
  value: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  expected_close_date: string;
  assigned_to?: number | null;
}

export interface KanbanColumn {
  status_id: number;
  status_name: string;
  status_color: string;
  count: number;
  total_value: number;
  opportunities: OpportunityList[];
}

export interface OpportunityActivityCreate {
  opportunity: number;
  type: 'note' | 'call' | 'meeting' | 'email' | 'task';
  title: string;
  description: string;
  performed_at: string;
}
