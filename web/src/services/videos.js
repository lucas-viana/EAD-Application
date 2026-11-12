// Serviço da E3: getVideo(lessonId) → { url, expiresAt }.
// 401 sem sessão; 404 aula desconhecida; 503 indisponível.
import { apiRequest } from './api-client.js';

export const getVideo = (lessonId, signal) =>
  apiRequest(`/api/videos/${encodeURIComponent(lessonId)}`, { signal });
