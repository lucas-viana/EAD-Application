import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Page } from '../../components/page.jsx';
import { TextField } from '../../components/text-field.jsx';
import { Button } from '../../components/button.jsx';
import { Message } from '../../components/message.jsx';
import { useSession } from '../auth/session-context.jsx';
import * as accountService from '../../services/account.js';
import { validateConfirmation, validateEmail, validateNewPassword } from '../auth/validation.js';
import { describeDevice, formatDate, formatDateTime } from './format.js';

function useSignedOutHandler() {
  const { markSignedOut } = useSession();
  const navigate = useNavigate();
  return useCallback(
    (error) => {
      if (error?.status === 401) {
        markSignedOut();
        navigate('/entrar', { replace: true });
        return true;
      }
      return false;
    },
    [markSignedOut, navigate],
  );
}

function ProfileSection({ account, onSaved }) {
  const handleSignedOut = useSignedOutHandler();
  const [values, setValues] = useState({
    fullName: account.fullName ?? '',
    email: account.email,
    currentPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const emailChanged = values.email.trim().toLowerCase() !== account.email;

  const update = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {
      email: validateEmail(values.email),
      currentPassword: emailChanged && !values.currentPassword ? 'Informe sua senha atual para trocar o e-mail.' : null,
    };
    setErrors(next);
    setFeedback(null);
    if (next.email || next.currentPassword) {
      return;
    }
    setSaving(true);
    try {
      const updated = await accountService.updateAccount({
        fullName: values.fullName,
        email: emailChanged ? values.email.trim() : undefined,
        currentPassword: emailChanged ? values.currentPassword : undefined,
      });
      setValues({ fullName: updated.fullName ?? '', email: updated.email, currentPassword: '' });
      onSaved(updated);
      setFeedback({ tone: 'success', text: 'Dados atualizados.' });
    } catch (error) {
      if (handleSignedOut(error)) {
        return;
      }
      if (error.fields && Object.keys(error.fields).length > 0) {
        setErrors(error.fields);
      } else {
        setFeedback({ tone: 'error', text: error.message });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="surface account-section" onSubmit={handleSubmit} noValidate aria-labelledby="dados">
      <h2 id="dados" className="heading">
        Dados da conta
      </h2>
      {feedback && <Message tone={feedback.tone} title={feedback.text} />}
      <TextField
        label="Nome"
        name="name"
        autoComplete="name"
        placeholder="Como você quer ser chamado"
        hint="Opcional. Visível apenas para você e para a administração do curso."
        error={errors.fullName}
        value={values.fullName}
        maxLength={120}
        onChange={update('fullName')}
      />
      <TextField
        label="E-mail"
        type="email"
        name="email"
        autoComplete="email"
        hint="Usado para entrar e recuperar o acesso."
        error={errors.email}
        value={values.email}
        onChange={update('email')}
        required
      />
      {emailChanged && (
        <TextField
          label="Senha atual"
          type="password"
          name="current-password"
          autoComplete="current-password"
          hint="Para trocar o e-mail, confirme sua senha."
          error={errors.currentPassword}
          value={values.currentPassword}
          onChange={update('currentPassword')}
          required
        />
      )}
      <div>
        <Button type="submit" variant="primary" wide loading={saving} loadingLabel="Salvando">
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}

function PasswordSection({ onChanged }) {
  const handleSignedOut = useSignedOutHandler();
  const empty = { currentPassword: '', newPassword: '', confirmation: '' };
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  const update = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {
      currentPassword: values.currentPassword ? null : 'Informe sua senha atual.',
      newPassword: validateNewPassword(values.newPassword),
      confirmation: validateConfirmation(values.newPassword, values.confirmation),
    };
    setErrors(next);
    setFeedback(null);
    if (next.currentPassword || next.newPassword || next.confirmation) {
      return;
    }
    setSaving(true);
    try {
      await accountService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setValues(empty);
      setFeedback({ tone: 'success', text: 'Senha alterada. Os outros dispositivos foram desconectados.' });
      onChanged();
    } catch (error) {
      if (handleSignedOut(error)) {
        return;
      }
      if (error.fields && Object.keys(error.fields).length > 0) {
        setErrors(error.fields);
      } else {
        setFeedback({ tone: 'error', text: error.message });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="surface account-section" onSubmit={handleSubmit} noValidate aria-labelledby="senha">
      <h2 id="senha" className="heading">
        Senha
      </h2>
      {feedback && <Message tone={feedback.tone} title={feedback.text} />}
      <TextField
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword}
        value={values.currentPassword}
        onChange={update('currentPassword')}
        required
      />
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        hint="Use pelo menos 8 caracteres. Os outros dispositivos conectados serão desconectados."
        error={errors.newPassword}
        value={values.newPassword}
        onChange={update('newPassword')}
        required
      />
      <TextField
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmation}
        value={values.confirmation}
        onChange={update('confirmation')}
        required
      />
      <div>
        <Button type="submit" variant="primary" wide loading={saving} loadingLabel="Alterando">
          Alterar senha
        </Button>
      </div>
    </form>
  );
}

function SessionsSection({ sessions, onRevoked, loadError }) {
  const handleSignedOut = useSignedOutHandler();
  const [revoking, setRevoking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const others = sessions.filter((session) => !session.current).length;

  const revoke = async () => {
    setRevoking(true);
    setFeedback(null);
    try {
      const { revoked } = await accountService.revokeOtherSessions();
      setFeedback({
        tone: 'success',
        text: revoked === 1 ? '1 dispositivo foi desconectado.' : `${revoked} dispositivos foram desconectados.`,
      });
      onRevoked();
    } catch (error) {
      if (!handleSignedOut(error)) {
        setFeedback({ tone: 'error', text: error.message });
      }
    } finally {
      setRevoking(false);
    }
  };

  return (
    <section className="surface account-section" aria-labelledby="dispositivos">
      <h2 id="dispositivos" className="heading">
        Dispositivos conectados
      </h2>
      {feedback && <Message tone={feedback.tone} title={feedback.text} />}
      {loadError && <Message tone="error" title={loadError} />}
      <ul className="session-list" role="list">
        {sessions.map((session) => (
          <li key={session.id} className="session-list__item">
            <p className="text-label">
              {describeDevice(session.userAgent)}
              {session.current && <span className="badge badge--success">Este dispositivo</span>}
            </p>
            <p className="text-caption">
              Conectado em {formatDateTime(session.createdAt)} · última atividade{' '}
              {formatDateTime(session.lastSeenAt)}
            </p>
          </li>
        ))}
      </ul>
      <div>
        <Button
          variant="secondary"
          wide
          onClick={revoke}
          loading={revoking}
          disabled={others === 0}
          loadingLabel="Desconectando"
        >
          Sair dos outros dispositivos
        </Button>
      </div>
    </section>
  );
}

function DeleteSection() {
  const { markSignedOut } = useSession();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (confirming) {
      passwordRef.current?.focus();
    }
  }, [confirming]);

  const handleDelete = async (event) => {
    event.preventDefault();
    if (!password) {
      setError('Informe sua senha para confirmar.');
      return;
    }
    setDeleting(true);
    try {
      await accountService.deleteAccount(password);
      markSignedOut();
      navigate('/', { replace: true });
    } catch (err) {
      setDeleting(false);
      setError(err.fields?.password ?? err.message);
    }
  };

  return (
    <section className="surface account-section" aria-labelledby="excluir">
      <h2 id="excluir" className="heading">
        Excluir conta
      </h2>
      <p>
        A exclusão remove seu e-mail, nome e senha. Os registros de acesso às aulas são mantidos
        apenas como contagem, sem identificação. Textos, podcasts e infográficos continuam livres.
      </p>
      {!confirming ? (
        <div>
          <Button variant="secondary" wide onClick={() => setConfirming(true)}>
            Quero excluir minha conta
          </Button>
        </div>
      ) : (
        <form className="stack" onSubmit={handleDelete} noValidate>
          <Message tone="warning" title="Esta ação não pode ser desfeita." />
          <TextField
            ref={passwordRef}
            label="Senha"
            type="password"
            autoComplete="current-password"
            hint="Digite sua senha para confirmar a exclusão."
            error={error}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <div className="row">
            <Button type="submit" variant="danger" wide loading={deleting} loadingLabel="Excluindo">
              Excluir minha conta
            </Button>
            <Button
              variant="secondary"
              wide
              onClick={() => {
                setConfirming(false);
                setPassword('');
                setError(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

/** Minha conta: o usuário consulta e atualiza as próprias informações. */
export function AccountPage() {
  const { updateUser } = useSession();
  const handleSignedOut = useSignedOutHandler();
  const [account, setAccount] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [sessionsError, setSessionsError] = useState(null);

  const loadSessions = useCallback(async () => {
    try {
      setSessions(await accountService.listSessions());
      setSessionsError(null);
    } catch (err) {
      if (!handleSignedOut(err)) {
        setSessionsError(err.message);
      }
    }
  }, [handleSignedOut]);

  useEffect(() => {
    let active = true;
    accountService
      .getAccount()
      .then((data) => active && setAccount(data))
      .catch((err) => active && !handleSignedOut(err) && setError(err.message));
    loadSessions();
    return () => {
      active = false;
    };
  }, [handleSignedOut, loadSessions]);

  return (
    <Page
      title="Minha conta"
      lead="Consulte e atualize seus dados de acesso. A conta libera os vídeos; os demais materiais continuam livres."
    >
      {error && <Message tone="error" title={error} />}
      {!account && !error && (
        <p className="loading" role="status">
          <span className="button__spinner" aria-hidden="true" /> Carregando seus dados…
        </p>
      )}
      {account && (
        <div className="account-layout">
          <ProfileSection
            account={account}
            onSaved={(updated) => {
              setAccount(updated);
              updateUser({ email: updated.email, fullName: updated.fullName });
            }}
          />
          <PasswordSection onChanged={loadSessions} />
          <SessionsSection sessions={sessions} onRevoked={loadSessions} loadError={sessionsError} />
          <DeleteSection />
          <p className="text-caption account-meta">
            Conta criada em {formatDate(account.createdAt)}
            {account.lastLoginAt && ` · último login em ${formatDateTime(account.lastLoginAt)}`}
          </p>
        </div>
      )}
    </Page>
  );
}
