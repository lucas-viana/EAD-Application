import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { SessionProvider } from '../src/features/auth/session-context.jsx';
import { routes } from '../src/app.jsx';

function json(status, body) {
  return Promise.resolve(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function renderAt(path, handlers = {}) {
  const calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((url, options = {}) => {
      const key = `${options.method ?? 'GET'} ${url}`;
      calls.push({ key, body: options.body ? JSON.parse(options.body) : undefined });
      const handler = handlers[key];
      if (handler) {
        return handler(options);
      }
      if (key === 'GET /api/session') {
        return json(200, { authenticated: false });
      }
      return json(404, { error: 'not_found', message: 'Não encontrado.' });
    }),
  );
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>,
  );
  return { router, calls };
}

beforeEach(() => {
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('aula sem sessão', () => {
  it('mostra o texto público e pede login para o vídeo, preservando a aula', async () => {
    renderAt('/aulas/m02-a02');
    expect(await screen.findByRole('heading', { level: 1, name: 'Criando e nomeando pastas' })).toBeInTheDocument();
    expect(screen.getByText('Módulo 2 · Aula 2 de 3')).toBeInTheDocument();
    expect(screen.getByText(/Uma pasta reúne arquivos/)).toBeInTheDocument();
    const login = await screen.findByRole('link', { name: 'Entrar para assistir' });
    expect(login).toHaveAttribute('href', '/entrar?returnTo=%2Faulas%2Fm02-a02');
  });
});

describe('login pelo vídeo', () => {
  it('mostra o estado de erro e, com sucesso, volta à mesma aula e registra o acesso', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    const { router, calls } = renderAt('/entrar?returnTo=%2Faulas%2Fm02-a02', {
      'POST /api/auth/login': () => {
        attempts += 1;
        return attempts === 1
          ? json(401, {
              error: 'invalid_credentials',
              message: 'E-mail ou senha não conferem. Confira os dados e tente novamente.',
            })
          : json(200, { authenticated: true, user: { id: 'u1', email: 'ana@exemplo.com', role: 'LEARNER' } });
      },
      'POST /api/access-events': () => json(201, { recorded: true, duplicate: false }),
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Entre para assistir' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-errada');
    await user.click(screen.getByRole('button', { name: 'Entrar e voltar ao vídeo' }));

    expect(await screen.findByText('E-mail ou senha não conferem. Confira os dados e tente novamente.')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true');

    await user.type(screen.getByLabelText('Senha'), 'senha-correta');
    await user.click(screen.getByRole('button', { name: 'Entrar e voltar ao vídeo' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/aulas/m02-a02'));
    await waitFor(() =>
      expect(calls.some((c) => c.key === 'POST /api/access-events' && c.body.lessonId === 'm02-a02')).toBe(true),
    );
    expect(await screen.findByRole('button', { name: 'Reproduzir vídeo' })).toBeInTheDocument();
  });
});

describe('vídeo indisponível', () => {
  it('oferece tentar novamente ou seguir pelo texto', async () => {
    const user = userEvent.setup();
    renderAt('/aulas/m01-a01', {
      'GET /api/session': () =>
        json(200, { authenticated: true, user: { id: 'u1', email: 'ana@exemplo.com', role: 'LEARNER' } }),
      'POST /api/access-events': () => json(200, { recorded: false, duplicate: true }),
      'GET /api/videos/m01-a01': () => json(503, { error: 'video_unavailable', message: 'O vídeo não carregou.' }),
    });
    await user.click(await screen.findByRole('button', { name: 'Reproduzir vídeo' }));
    expect(await screen.findByText('O vídeo não carregou')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ler o texto da aula' })).toBeInTheDocument();
  });
});

describe('cadastro', () => {
  it('valida a confirmação de senha antes de enviar', async () => {
    const user = userEvent.setup();
    const { calls } = renderAt('/criar-acesso');
    expect(await screen.findByRole('heading', { level: 1, name: 'Crie sua conta' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-segura-1');
    await user.type(screen.getByLabelText('Confirmar senha'), 'senha-diferente');
    await user.click(screen.getByRole('button', { name: 'Criar conta e ver módulos' }));
    expect(await screen.findByText('As senhas não são iguais. Digite a mesma senha.')).toBeInTheDocument();
    expect(calls.some((c) => c.key === 'POST /api/auth/register')).toBe(false);
  });
});
