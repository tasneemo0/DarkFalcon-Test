const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, options);
}

export { API_BASE_URL };