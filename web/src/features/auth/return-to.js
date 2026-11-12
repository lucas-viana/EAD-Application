import { isKnownLesson } from '../../content/index.js';

export const DEFAULT_RETURN_TO = '/modulos';
const LESSON_PATH = /^\/aulas\/(m0[1-6]-a0[1-3])$/;

/**
 * returnTo aceita apenas /modulos ou /aulas/:lessonId existente; ausente ou inválido → /modulos.
 */
export function sanitizeReturnTo(value) {
  if (typeof value !== 'string') {
    return DEFAULT_RETURN_TO;
  }
  if (value === DEFAULT_RETURN_TO) {
    return value;
  }
  const match = LESSON_PATH.exec(value);
  return match && isKnownLesson(match[1]) ? value : DEFAULT_RETURN_TO;
}

/** Acesso solicitado por um vídeo: o destino é uma aula. */
export const isLessonReturn = (returnTo) => LESSON_PATH.test(returnTo);

export const lessonReturnTo = (lessonId) => `/aulas/${lessonId}`;

/** Monta um link de autenticação preservando o destino ao alternar entre as telas. */
export function authPath(path, returnTo) {
  if (!returnTo || returnTo === DEFAULT_RETURN_TO) {
    return path;
  }
  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}
