// API Configuration for CloneLM Frontend
export const API_CONFIG = {
  // Development (local backend)
  development: {
    baseURL: 'http://localhost:8080/api',
    timeout: 30000,
  },
  // Production (Render backend)
  production: {
    baseURL: 'https://clonelm.onrender.com/api',
    timeout: 60000, // Longer timeout for Render (cold starts)
  },
};

// Get current environment
const isDevelopment = import.meta.env.DEV;

// Export the appropriate config
export const API_BASE_URL = isDevelopment 
  ? API_CONFIG.development.baseURL 
  : API_CONFIG.production.baseURL;

export const API_TIMEOUT = isDevelopment 
  ? API_CONFIG.development.timeout 
  : API_CONFIG.production.timeout;

// API Endpoints
export const API_ENDPOINTS = {
  // File Operations
  UPLOAD: '/upload',
  FILES: '/files',
  PROCESS_PDF: '/process-pdf',
  
  // File Viewing & Download
  VIEW_FILE: '/files',
  DOWNLOAD_FILE: '/download',
  
  // AI Interaction
  ASK: '/ask',
  SUMMARY: '/summary',
  PROCESSED_DOCUMENTS: '/processed-documents',
  
  // System
  HEALTH: '/health',
  
  // Document Management
  DELETE_DOCUMENT: '/document',
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = `${API_BASE_URL}${endpoint}`;
  
  if (params) {
    const queryParams = new URLSearchParams(params);
    url += `?${queryParams.toString()}`;
  }
  
  return url;
};

// Helper function to build file viewing URLs
export const buildFileViewUrl = (filename: string): string => {
  return buildApiUrl(`${API_ENDPOINTS.VIEW_FILE}/${filename}`);
};

// Helper function to build file download URLs
export const buildFileDownloadUrl = (filename: string): string => {
  return buildApiUrl(`${API_ENDPOINTS.DOWNLOAD_FILE}/${filename}`);
};
