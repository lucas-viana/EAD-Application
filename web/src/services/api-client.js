// Cliente da API compartilhado. Toda operação remota é assíncrona e lança ApiError em caso de falha.
const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'X-XSRF-TOKEN';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const GENERIC_ERROR = 'Algo não funcionou como esperado. Tente novamente.';
export const NETWORK_ERROR = 'Não foi possível conectar. Verifique sua internet e tente novamente.';

export class ApiError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function readCookie(name) {
  const prefix = `${name}=`;
  const entry = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

async function send(path, { method, body, signal }) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (!SAFE_METHODS.has(method)) {
    const token = readCookie(CSRF_COOKIE);
    if (token) {
      headers[CSRF_HEADER] = token;
    }
  }
  try {
    return await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(0, 'network_error', NETWORK_ERROR);
  }
}

async function parse(response) {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const upperMethod = method.toUpperCase();
  let response = await send(path, { method: upperMethod, body, signal });

  // Token CSRF ausente ou antigo: renova pelo GET /api/session e repete uma vez.
  if (response.status === 403 && !SAFE_METHODS.has(upperMethod)) {
    const data = await parse(response.clone());
    if (data?.error === 'csrf_invalid') {
      await send('/api/session', { method: 'GET', signal });
      response = await send(path, { method: upperMethod, body, signal });
    }
  }

  const data = await parse(response);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error ?? 'http_error',
      data?.message ?? GENERIC_ERROR,
      data?.fields ?? {},
    );
  }
  return data;
}
