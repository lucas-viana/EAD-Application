import { useEffect, useRef } from 'react';
import { useSession } from '../auth/session-context.jsx';
import { recordAccess } from '../../services/access.js';

/**
 * Informa a abertura da aula ao serviço da E6 quando há sessão autenticada,
 * inclusive no retorno após login. O servidor garante uma ocorrência por sessão+aula:
 * recarregar a página ou abrir outra aba não duplica. Falhas não bloqueiam a leitura.
 */
export function useRecordAccess(lessonId) {
  const { status, user } = useSession();
  const sent = useRef(new Set());
  const userId = user?.id;

  useEffect(() => {
    if (status !== 'authenticated' || !lessonId || !userId) {
      return;
    }
    const key = `${userId}:${lessonId}`;
    if (sent.current.has(key)) {
      return;
    }
    sent.current.add(key);
    recordAccess(lessonId).catch(() => {
      // Permite nova tentativa em uma próxima abertura; a chave no servidor evita duplicação.
      sent.current.delete(key);
    });
  }, [status, userId, lessonId]);
}
