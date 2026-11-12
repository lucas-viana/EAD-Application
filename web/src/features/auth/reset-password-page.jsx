import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Page } from '../../components/page.jsx';
import { TextField } from '../../components/text-field.jsx';
import { Button, ButtonLink } from '../../components/button.jsx';
import { Message } from '../../components/message.jsx';
import { confirmPasswordReset } from '../../services/auth.js';
import { useSession } from './session-context.jsx';
import { validateConfirmation, validateNewPassword } from './validation.js';

/** Conclusão da recuperação: link do e-mail com token de uso único (válido por 1 hora). */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { markSignedOut } = useSession();
  const [values, setValues] = useState({ password: '', confirmation: '' });
  const [errors, setErrors] = useState({});
  const [tokenError, setTokenError] = useState(token ? null : 'O link de recuperação está incompleto.');
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef(null);
  const alertRef = useRef(null);

  useEffect(() => {
    if (tokenError) {
      alertRef.current?.focus();
    }
  }, [tokenError]);

  const update = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {
      password: validateNewPassword(values.password),
      confirmation: validateConfirmation(values.password, values.confirmation),
    };
    setErrors(next);
    if (next.password || next.confirmation) {
      passwordRef.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset({ token, password: values.password });
      // Uma nova senha encerra as sessões abertas.
      markSignedOut();
      navigate('/entrar', {
        replace: true,
        state: { notice: 'Senha alterada. Entre com a nova senha.' },
      });
    } catch (error) {
      setSubmitting(false);
      if (error.code === 'invalid_token') {
        setTokenError(error.message);
      } else if (error.fields?.password) {
        setErrors({ password: error.fields.password });
        passwordRef.current?.focus();
      } else {
        setTokenError(error.message);
      }
    }
  };

  if (tokenError) {
    return (
      <Page title="Crie uma nova senha" documentTitle="Nova senha">
        <div className="surface auth-card">
          <Message ref={alertRef} tone="error" title={tokenError} />
          <ButtonLink variant="primary" block to="/recuperar-acesso">
            Pedir um novo link
          </ButtonLink>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Crie uma nova senha"
      documentTitle="Nova senha"
      lead="Escolha uma senha longa que você não utiliza em outros serviços."
    >
      <form className="surface auth-card" onSubmit={handleSubmit} noValidate>
        <h2 className="heading">Nova senha</h2>
        <TextField
          ref={passwordRef}
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="Crie uma senha"
          hint='Use pelo menos 8 caracteres.'
          error={errors.password}
          value={values.password}
          onChange={update('password')}
          required
        />
        <TextField
          label="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="Repita sua senha"
          hint='Digite a mesma senha para conferir.'
          error={errors.confirmation}
          value={values.confirmation}
          onChange={update('confirmation')}
          required
        />
        <Button type="submit" variant="primary" block loading={submitting} loadingLabel="Salvando">
          Salvar nova senha
        </Button>
      </form>
    </Page>
  );
}
