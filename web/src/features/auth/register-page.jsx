import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Page } from '../../components/page.jsx';
import { TextField } from '../../components/text-field.jsx';
import { Button, ButtonLink } from '../../components/button.jsx';
import { Message } from '../../components/message.jsx';
import { useSession } from './session-context.jsx';
import { useReturnTo } from './use-return-to.js';
import { authPath } from './return-to.js';
import { validateConfirmation, validateEmail, validateNewPassword } from './validation.js';

/** Criar acesso: apenas os dados de acesso. Os outros materiais continuam livres. */
export function RegisterPage() {
  const { status, register } = useSession();
  const { returnTo, fromVideo } = useReturnTo();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: '', password: '', confirmation: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const refs = { email: useRef(null), password: useRef(null), confirmation: useRef(null) };
  const alertRef = useRef(null);

  useEffect(() => {
    if (formError) {
      alertRef.current?.focus();
    }
  }, [formError]);

  if (status === 'authenticated' && !submitting) {
    return <Navigate to={returnTo} replace />;
  }

  const update = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {
      email: validateEmail(values.email),
      password: validateNewPassword(values.password),
      confirmation: validateConfirmation(values.password, values.confirmation),
    };
    setErrors(next);
    setFormError(null);
    const firstInvalid = ['email', 'password', 'confirmation'].find((field) => next[field]);
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await register({ email: values.email.trim(), password: values.password });
      navigate(returnTo, { replace: true });
    } catch (error) {
      setSubmitting(false);
      if (error.fields && Object.keys(error.fields).length > 0) {
        setErrors(error.fields);
        const field = Object.keys(error.fields)[0];
        refs[field]?.current?.focus();
        if (error.code === 'email_in_use') {
          setFormError(error.message);
        }
      } else {
        setFormError(error.message);
      }
    }
  };

  return (
    <Page
      title={fromVideo ? 'Crie seu acesso aos vídeos' : 'Crie sua conta'}
      documentTitle="Criar acesso"
      lead="Precisamos apenas dos dados de acesso. Os outros materiais continuam livres."
    >
      <form className="surface auth-card" onSubmit={handleSubmit} noValidate>
        <h2 className="heading">Dados de acesso</h2>
        {formError && <Message ref={alertRef} tone="error" title={formError} />}
        <TextField
          ref={refs.email}
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Digite seu e-mail"
          hint='Você usará este endereço para entrar e recuperar o acesso.'
          error={errors.email}
          value={values.email}
          onChange={update('email')}
          required
        />
        <TextField
          ref={refs.password}
          label="Senha"
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="Crie uma senha"
          hint='Use uma senha longa, com pelo menos 8 caracteres, que você não utiliza em outros serviços.'
          error={errors.password}
          value={values.password}
          onChange={update('password')}
          required
        />
        <TextField
          ref={refs.confirmation}
          label="Confirmar senha"
          type="password"
          name="confirm-password"
          autoComplete="new-password"
          placeholder="Repita sua senha"
          hint='Digite a mesma senha para conferir.'
          error={errors.confirmation}
          value={values.confirmation}
          onChange={update('confirmation')}
          required
        />
        <Button type="submit" variant="primary" block loading={submitting} loadingLabel="Criando acesso">
          {fromVideo ? 'Criar acesso e assistir' : 'Criar conta e ver módulos'}
        </Button>
        <ButtonLink variant="secondary" block to={authPath('/entrar', returnTo)}>
          Já tenho acesso
        </ButtonLink>
      </form>
    </Page>
  );
}
