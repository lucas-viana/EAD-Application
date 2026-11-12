// Serviços da E1: getSession(), login(), logout(), register(), requestPasswordReset().
import { apiRequest } from './api-client.js';

/** GET /api/session → { authenticated, user? } */
export const getSession = (signal) => apiRequest('/api/session', { signal });

/** POST /api/auth/login → { authenticated: true, user } */
export const login = ({ email, password }) =>
  apiRequest('/api/auth/login', { method: 'POST', body: { email, password } });

/** POST /api/auth/register → { authenticated: true, user } */
export const register = ({ email, password }) =>
  apiRequest('/api/auth/register', { method: 'POST', body: { email, password } });

/** POST /api/auth/logout → encerra a sessão no servidor. */
export const logout = () => apiRequest('/api/auth/logout', { method: 'POST' });

/** POST /api/auth/password-reset → confirmação genérica. */
export const requestPasswordReset = (email) =>
  apiRequest('/api/auth/password-reset', { method: 'POST', body: { email } });

/** POST /api/auth/password-reset/confirm → define a nova senha com o token do e-mail. */
export const confirmPasswordReset = ({ token, password }) =>
  apiRequest('/api/auth/password-reset/confirm', { method: 'POST', body: { token, password } });
