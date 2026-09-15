const PROD_RAILWAY_URL = 'https://shivpriya-silk-mills-production.up.railway.app';

// Read from Vite env if configured, or default to the live Railway backend in production / non-localhost
const envUrl = ((import.meta as any)?.env?.VITE_API_BASE_URL as string) || '';

export const API_BASE_URL = (
  envUrl ||
  (typeof window !== 'undefined' &&
   window.location.hostname !== 'localhost' &&
   window.location.hostname !== '127.0.0.1'
    ? PROD_RAILWAY_URL
    : '')
).replace(/\/$/, '');

export function apiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function getMediaUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    const base = API_BASE_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? PROD_RAILWAY_URL : '');
    return `${base}${url}`;
  }
  return url;
}

