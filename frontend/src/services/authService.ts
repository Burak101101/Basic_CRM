import apiClient from './apiClient';
import { AuthUser, AuthResponse, LoginData, RegisterData, PasswordChangeData, CompanyInfo } from '../types/auth';

// Authentication API endpoints
const AUTH_URL = '/api/v1/auth/';

// Register a new user
export const registerUser = async (userData: RegisterData): Promise<AuthResponse> => {
  // Use complete URL to avoid any routing issues
  const response = await apiClient.post(`/api/v1/auth/register/`, userData);
  
  // Store token in localStorage
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response.data;
};

export const getCompanyInfo = async (): Promise<CompanyInfo> => {
  const response = await apiClient.get(`${AUTH_URL}profile/company-info/`);
  return response.data;
};

export const updateCompanyInfo = async (companyData: Partial<CompanyInfo>): Promise<CompanyInfo> => {
  const response = await apiClient.put(`${AUTH_URL}profile/company-info/`, companyData);
  return response.data;
};

// Login a user
export const loginUser = async (credentials: LoginData): Promise<AuthResponse> => {
  // Use complete URL to avoid any routing issues
  const response = await apiClient.post(`/api/v1/auth/login/`, credentials);
  
  // Store token in localStorage
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response.data;
};

// Logout a user
export const logoutUser = async (): Promise<void> => {
  try {
    // Use complete URL to avoid any routing issues
    await apiClient.post(`/api/v1/auth/logout/`);
  } finally {
    // Always clear local storage regardless of API response
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
};

// Get current user profile
export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await apiClient.get(`${AUTH_URL}profile/`);
  return response.data;
};

// Update user profile
export const updateProfile = async (userData: Partial<AuthUser>): Promise<AuthUser> => {
  const response = await apiClient.put(`${AUTH_URL}profile/`, userData);
  
  // Update stored user data
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const updatedUser = { ...currentUser, ...response.data };
  localStorage.setItem('user', JSON.stringify(updatedUser));
  
  return response.data;
};

// Change password
export const changePassword = async (passwordData: PasswordChangeData): Promise<{ detail: string; token: string }> => {
  const response = await apiClient.post(`${AUTH_URL}change-password/`, passwordData);
  
  // Update token
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
  }
  
  return response.data;
};

// Helper function to check if user is logged in
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('authToken') !== null;
};

// Get current user from local storage
export const getStoredUser = (): AuthUser | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get auth token from local storage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};
