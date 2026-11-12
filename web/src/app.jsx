import { createBrowserRouter, RouterProvider } from 'react-router';
import { SessionProvider } from './features/auth/session-context.jsx';
import { AppLayout } from './components/app-layout.jsx';
import { HomePage } from './features/catalog/home-page.jsx';
import { CatalogPage } from './features/catalog/catalog-page.jsx';
import { ModulePage } from './features/catalog/module-page.jsx';
import { NotFoundPage } from './features/catalog/not-found-page.jsx';
import { LessonPage } from './features/classroom/lesson-page.jsx';
import { LoginPage } from './features/auth/login-page.jsx';
import { RegisterPage } from './features/auth/register-page.jsx';
import { RecoveryPage } from './features/auth/recovery-page.jsx';
import { ResetPasswordPage } from './features/auth/reset-password-page.jsx';
import { RequireAdmin, RequireAuth } from './features/auth/require-auth.jsx';
import { StudyHelpPage } from './features/study-help/study-help-page.jsx';
import { AccountPage } from './features/account/account-page.jsx';
import { AdminUsersPage } from './features/admin/admin-users-page.jsx';

/**
 * Rotas do contrato E2. Desktop/mobile e os estados ilustrados compartilham código;
 * não há rotas por frame.
 */
export const routes = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/modulos', element: <CatalogPage /> },
      { path: '/modulos/:moduleId', element: <ModulePage /> },
      { path: '/aulas/:lessonId', element: <LessonPage /> },
      { path: '/entrar', element: <LoginPage /> },
      { path: '/criar-acesso', element: <RegisterPage /> },
      { path: '/recuperar-acesso', element: <RecoveryPage /> },
      { path: '/redefinir-senha', element: <ResetPasswordPage /> },
      { path: '/como-estudar', element: <StudyHelpPage /> },
      {
        path: '/minha-conta',
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },
      {
        path: '/admin/usuarios',
        element: (
          <RequireAdmin>
            <AdminUsersPage />
          </RequireAdmin>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

const router = createBrowserRouter(routes);

export function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  );
}
