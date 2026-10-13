import axios from 'axios';

/** Axios instance – all requests go through the Next.js /api rewrite (same-origin cookies). */
const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 60000 });

export function getErrorMessage(err, fallback = 'Something went wrong. Please try again') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The request took too long. Check your connection and try again';
  if (err?.message === 'Network Error') return 'Cannot reach the server. Check your connection';
  return fallback;
}

export const fileUrl = (filename, download = false) =>
  `/api/files/${encodeURIComponent(filename)}${download ? '?download=1' : ''}`;

export default api;
