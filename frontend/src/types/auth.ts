// Types for authentication
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface CompanyInfo {
  company_name: string;
  company_industry: string;
  company_position: string;
  company_size: string;
  company_website: string;
  company_linkedin_url: string;
  company_location: string;
  company_description: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export interface PasswordChangeData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}
