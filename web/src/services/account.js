// "Minha conta": dados do próprio usuário.
import { apiRequest } from './api-client.js';

export const getAccount = () => apiRequest('/api/account');

export const updateAccount = ({ fullName, email, currentPassword }) =>
  apiRequest('/api/account', { method: 'PATCH', body: { fullName, email, currentPassword } });

export const changePassword = ({ currentPassword, newPassword }) =>
  apiRequest('/api/account/password', { method: 'PUT', body: { currentPassword, newPassword } });

export const listSessions = () => apiRequest('/api/account/sessions');

export const revokeOtherSessions = () =>
  apiRequest('/api/account/sessions/revoke-others', { method: 'POST' });

export const deleteAccount = (password) =>
  apiRequest('/api/account', { method: 'DELETE', body: { password } });
