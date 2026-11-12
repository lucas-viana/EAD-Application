// Administração de contas (perfil ADMIN).
import { apiRequest } from './api-client.js';

export const listUsers = ({ query = '', page = 0, size = 20 } = {}) => {
  const params = new URLSearchParams({ query, page: String(page), size: String(size) });
  return apiRequest(`/api/admin/users?${params}`);
};

export const updateUser = (id, changes) =>
  apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes });

export const deleteUser = (id) =>
  apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const getSummary = () => apiRequest('/api/admin/summary');
