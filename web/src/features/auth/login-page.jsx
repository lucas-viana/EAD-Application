import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Page } from '../../components/page.jsx';
import { TextField } from '../../components/text-field.jsx';
import { Button, ButtonLink } from '../../components/button.jsx';
import { Message } from '../../components/message.jsx';
import { useSession } from './session-context.jsx';
import { useReturnTo } from './use-return-to.js';
import { authPath } from './return-to.js';
import { validateEmail } from './validation.js';

/**
 * Entrar. Pela apresentação, segue ao catálogo; pelo vídeo, retorna à aula de origem.
 * Estados ilustrados no Figma (padrão, erro, foco no e-mail) são estados desta mesma tela.
 */
export function LoginPage() {
  const { status, login } = useSession();
  const { returnTo, fromVideo } = useReturnTo();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const alertRef = useRef(null);
  const notice = location.state?.notice;

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
      password: values.password ? null : 'Informe sua senha.',
    };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) {
      (next.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate(returnTo, { replace: true });
    } catch (error) {
      setSubmitting(false);
      if (error.code === 'invalid_credentials') {
        // Estado "Entrar / Erro": os dois campos destacados, mensagem sob a senha.
        setErrors({ email: true, password: error.message });
        setValues((v) => ({ ...v, password: '' }));
        passwordRef.current?.focus();
      } else if (error.code === 'validation_error') {
        setErrors(error.fields);
      } else {
        setFormError(error.message);
      }
    }
  };

  return (
    <Page
      title={fromVideo ? 'Entre para assistir' : 'Entre na sua conta'}
      documentTitle="Entrar"
      lead={
        fromVideo
          ? 'Seu acesso libera os vídeos e registra sua visita. Depois, você volta à aula escolhida.'
          : 'Entre para escolher um módulo e assistir aos vídeos.'
      }
    >
      <form className="surface auth-card" onSubmit={handleSubmit} noValidate>
        <h2 className="heading">Acesso aos vídeos</h2>
        {notice && <Message tone="success" title={notice} />}
        {formError && <Message ref={alertRef} tone="error" title={formError} />}
        <TextField
          ref={emailRef}
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Digite seu e-mail"
          hint="Use o e-mail da sua conta."
          error={errors.email}
          value={values.email}
          onChange={update('email')}
          required
        />
        <TextField
          ref={passwordRef}
          label="Senha"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          hint="Sua senha fica oculta enquanto você digita."
          error={errors.password}
          value={values.password}
          onChange={update('password')}
          required
        />
        <Button type="submit" variant="primary" block loading={submitting} loadingLabel="Entrando">
          {fromVideo ? 'Entrar e voltar ao vídeo' : 'Entrar e ver módulos'}
        </Button>
        <ButtonLink variant="secondary" block to={authPath('/recuperar-acesso', returnTo)}>
          Esqueci minha senha
        </ButtonLink>
        <ButtonLink variant="secondary" block to={authPath('/criar-acesso', returnTo)}>
          Criar acesso
        </ButtonLink>
      </form>
      <div>
        <ButtonLink variant="secondary" wide to={returnTo}>
          Continuar sem entrar
        </ButtonLink>
      </div>
    </Page>
  );
}
