import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../../services/auth.js';

const SessionContext = createContext(null);

/**
 * Estado da sessão validada pelo servidor (E1). E3/E4/E6 consomem via useSession().
 * status: 'loading' | 'authenticated' | 'anonymous'
 */
export function SessionProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });

  const refresh = useCallback(async (signal) => {
    try {
      const session = await authService.getSession(signal);
      setState(
        session?.authenticated
          ? { status: 'authenticated', user: session.user }
          : { status: 'anonymous', user: null },
      );
      return session;
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      }
      // API indisponível: os materiais públicos continuam acessíveis.
      setState({ status: 'anonymous', user: null, error });
      return null;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    const session = await authService.login(credentials);
    setState({ status: 'authenticated', user: session.user });
    return session;
  }, []);

  const register = useCallback(async (credentials) => {
    const session = await authService.register(credentials);
    setState({ status: 'authenticated', user: session.user });
    return session;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setState({ status: 'anonymous', user: null });
    }
  }, []);

  /** Atualiza os dados exibidos após alterações em "Minha conta". */
  const updateUser = useCallback((changes) => {
    setState((current) =>
      current.user ? { ...current, user: { ...current.user, ...changes } } : current,
    );
  }, []);

  /** Sessão encerrada pelo servidor (expirada, revogada ou conta excluída). */
  const markSignedOut = useCallback(() => {
    setState({ status: 'anonymous', user: null });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: state.status === 'authenticated',
      isAdmin: state.user?.role === 'ADMIN',
      refresh,
      login,
      register,
      logout,
      updateUser,
      markSignedOut,
    }),
    [state, refresh, login, register, logout, updateUser, markSignedOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession precisa estar dentro de <SessionProvider>.');
  }
  return context;
}
