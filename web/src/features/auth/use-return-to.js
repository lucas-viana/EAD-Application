import { useSearchParams } from 'react-router';
import { isLessonReturn, sanitizeReturnTo } from './return-to.js';

/** Destino validado da autenticação e origem (apresentação ou vídeo). */
export function useReturnTo() {
  const [params] = useSearchParams();
  const raw = params.get('returnTo');
  const returnTo = sanitizeReturnTo(raw);
  return { returnTo, fromVideo: isLessonReturn(returnTo) };
}
