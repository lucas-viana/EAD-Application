import { Outlet, ScrollRestoration } from 'react-router';
import { SiteHeader } from './site-header.jsx';
import { SiteFooter } from './site-footer.jsx';

/** Menu e rodapé únicos para todas as páginas (não duplicar por módulo). */
export function AppLayout() {
  return (
    <>
      <SiteHeader />
      <Outlet />
      <SiteFooter />
      <ScrollRestoration />
    </>
  );
}
