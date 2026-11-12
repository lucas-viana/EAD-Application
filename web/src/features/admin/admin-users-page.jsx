import { useCallback, useEffect, useState } from 'react';
import { Page } from '../../components/page.jsx';
import { TextField } from '../../components/text-field.jsx';
import { Button } from '../../components/button.jsx';
import { Message } from '../../components/message.jsx';
import { useSession } from '../auth/session-context.jsx';
import * as adminService from '../../services/admin.js';
import { formatDate, formatDateTime } from '../account/format.js';

const ROLE_LABEL = { LEARNER: 'Cursista', ADMIN: 'Administração' };
const PAGE_SIZE = 20;

function SummaryCards({ summary }) {
  const items = [
    { label: 'Contas', value: summary.totalUsers },
    { label: 'Contas ativas', value: summary.activeUsers },
    { label: 'Administração', value: summary.admins },
    { label: 'Acessos identificados às aulas', value: summary.totalAccesses },
  ];
  return (
    <dl className="stat-grid">
      {items.map((item) => (
        <div key={item.label} className="stat">
          <dt className="stat__label">{item.label}</dt>
          <dd className="stat__value">{item.value.toLocaleString('pt-BR')}</dd>
        </div>
      ))}
    </dl>
  );
}

function UserRow({ user, isSelf, onChange, onDelete, busy }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <li className="user-row">
      <div className="user-row__info">
        <p className="text-label">
          {user.fullName || 'Sem nome'}
          {isSelf && <span className="badge">Você</span>}
        </p>
        <p className="user-row__email">{user.email}</p>
        <p className="text-caption">
          Criada em {formatDate(user.createdAt)} · último login{' '}
          {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'ainda não houve'}
        </p>
        <p className="row user-row__badges">
          <span className="badge">{ROLE_LABEL[user.role]}</span>
          <span className={user.active ? 'badge badge--success' : 'badge badge--muted'}>
            {user.active ? 'Ativa' : 'Desativada'}
          </span>
        </p>
      </div>
      {!isSelf && (
        <div className="user-row__actions">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => onChange(user, { active: !user.active })}
          >
            {user.active ? 'Desativar' : 'Reativar'}
            <span className="visually-hidden"> a conta de {user.email}</span>
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => onChange(user, { role: user.role === 'ADMIN' ? 'LEARNER' : 'ADMIN' })}
          >
            {user.role === 'ADMIN' ? 'Tornar cursista' : 'Tornar administração'}
            <span className="visually-hidden"> ({user.email})</span>
          </Button>
          {confirmDelete ? (
            <>
              <Button variant="danger" disabled={busy} onClick={() => onDelete(user)}>
                Confirmar exclusão
                <span className="visually-hidden"> de {user.email}</span>
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="secondary" disabled={busy} onClick={() => setConfirmDelete(true)}>
              Excluir
              <span className="visually-hidden"> a conta de {user.email}</span>
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Administração de contas. Não há notas, progresso ou painel docente:
 * o único indicador é a contagem de acessos identificados às aulas (E6).
 */
export function AdminUsersPage() {
  const { user: me } = useSession();
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [users, totals] = await Promise.all([
        adminService.listUsers({ query: appliedQuery, page, size: PAGE_SIZE }),
        adminService.getSummary(),
      ]);
      setData(users);
      setSummary(totals);
    } catch (error) {
      setFeedback({ tone: 'error', text: error.message });
    }
  }, [appliedQuery, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(0);
    setAppliedQuery(query.trim());
  };

  const handleChange = async (user, changes) => {
    setBusyId(user.id);
    setFeedback(null);
    try {
      await adminService.updateUser(user.id, changes);
      setFeedback({ tone: 'success', text: `Conta de ${user.email} atualizada.` });
      await load();
    } catch (error) {
      setFeedback({ tone: 'error', text: error.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user) => {
    setBusyId(user.id);
    setFeedback(null);
    try {
      await adminService.deleteUser(user.id);
      setFeedback({ tone: 'success', text: `Conta de ${user.email} excluída.` });
      await load();
    } catch (error) {
      setFeedback({ tone: 'error', text: error.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Page
      title="Usuários"
      lead="Consulte e administre as contas de acesso aos vídeos. A plataforma não registra notas nem progresso de aprendizagem."
    >
      {summary && <SummaryCards summary={summary} />}
      {feedback && <Message tone={feedback.tone} title={feedback.text} />}

      <form className="surface admin-search" role="search" onSubmit={handleSearch}>
        <TextField
          label="Buscar por nome ou e-mail"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Digite parte do nome ou do e-mail"
        />
        <div>
          <Button type="submit" variant="primary" wide>
            Buscar
          </Button>
        </div>
      </form>

      <section className="stack" aria-labelledby="lista-usuarios" aria-busy={!data}>
        <h2 id="lista-usuarios" className="heading">
          {data ? `${data.totalItems.toLocaleString('pt-BR')} conta(s)` : 'Contas'}
          {appliedQuery && ` para “${appliedQuery}”`}
        </h2>
        {data && data.items.length === 0 && <p>Nenhuma conta encontrada.</p>}
        {data && data.items.length > 0 && (
          <ul className="user-list" role="list">
            {data.items.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === me?.id}
                busy={busyId === user.id}
                onChange={handleChange}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
        {data && data.totalPages > 1 && (
          <nav className="row" aria-label="Páginas da lista">
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Página anterior
            </Button>
            <p className="pagination__status">
              Página {page + 1} de {data.totalPages}
            </p>
            <Button
              variant="secondary"
              disabled={page + 1 >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima página
            </Button>
          </nav>
        )}
      </section>

      {summary && (
        <details className="surface access-details">
          <summary className="heading access-details__summary">Acessos identificados por aula</summary>
          <p className="text-caption">
            Primeira abertura da aula por sessão autenticada. Não indica reprodução, conclusão ou
            aprendizagem.
          </p>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Aula</th>
                  <th scope="col">Título</th>
                  <th scope="col" className="data-table__number">
                    Acessos
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.lessons.map((lesson) => (
                  <tr key={lesson.lessonId}>
                    <td>{lesson.lessonId}</td>
                    <td>{lesson.title}</td>
                    <td className="data-table__number">{lesson.accesses.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </Page>
  );
}
