// Serviço da E6: recordAccess(lessonId) → { recorded, duplicate }.
// A falha de registro pode ser reenviada com a mesma chave (sessão+aula) sem bloquear a leitura.
import { apiRequest } from './api-client.js';

const RETRY_DELAYS_MS = [1000, 3000, 8000];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function recordAccess(lessonId) {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await apiRequest('/api/access-events', {
        method: 'POST',
        body: { type: 'lesson_open', lessonId },
      });
    } catch (error) {
      lastError = error;
      // Só repete falhas temporárias (rede ou servidor); 4xx não muda com nova tentativa.
      const retriable = error.status === 0 || error.status >= 500;
      if (!retriable || attempt === RETRY_DELAYS_MS.length) {
        break;
      }
      await wait(RETRY_DELAYS_MS[attempt]);
    }
  }
  throw lastError;
}
