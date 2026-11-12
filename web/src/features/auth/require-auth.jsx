import { Navigate, useLocation } from 'react-router';
import { useSession } from './session-context.jsx';
import { LoadingState } from '../../components/loading-state.jsx';
import { NotFoundPage } from '../catalog/not-found-page.jsx';

/** Páginas que exigem sessão (Minha conta). Sem sessão, segue para /entrar. */
export function RequireAuth({ children }) {
  const { status } = useSession();
  const location = useLocation();
  if (status === 'loading') {
    return <LoadingState label="Carregando sua conta" />;
  }
  if (status !== 'authenticated') {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  }
  return children;
}

/** Páginas de administração: para outros perfis, a página simplesmente não existe. */
export function RequireAdmin({ children }) {
  const { status, isAdmin } = useSession();
  if (status === 'loading') {
    return <LoadingState label="Carregando" />;
  }
  if (status !== 'authenticated') {
    return <Navigate to="/entrar" replace />;
  }
  if (!isAdmin) {
    return <NotFoundPage />;
  }
  return children;
}
