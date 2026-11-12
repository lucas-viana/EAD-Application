import { useEffect, useRef, useState } from 'react';
import { Page } from '../../components/page.jsx';
import { TextField } from '../../components/text-field.jsx';
import { Button, ButtonLink } from '../../components/button.jsx';
import { Message } from '../../components/message.jsx';
import { requestPasswordReset } from '../../services/auth.js';
import { useReturnTo } from './use-return-to.js';
import { authPath } from './return-to.js';
import { validateEmail } from './validation.js';

/** Recuperar acesso → Confirmação. A resposta é sempre genérica. */
export function RecoveryPage() {
  const { returnTo } = useReturnTo();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const emailRef = useRef(null);
  const alertRef = useRef(null);

  useEffect(() => {
    if (formError) {
      alertRef.current?.focus();
    }
  }, [formError]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const invalid = validateEmail(email);
    setError(invalid);
    setFormError(null);
    if (invalid) {
      emailRef.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      if (err.fields?.email) {
        setError(err.fields.email);
      } else {
        setFormError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Page
        title="Confira seu e-mail"
        lead="Se houver uma conta com esse endereço, você receberá as orientações de recuperação."
      >
        <section className="surface auth-card" aria-labelledby="sem-mensagem">
          <h2 id="sem-mensagem" className="heading">
            Não encontrou a mensagem?
          </h2>
          <p>Verifique também a pasta de spam. Você pode conferir o endereço informado e tentar novamente.</p>
          <Button variant="secondary" block onClick={() => setSent(false)}>
            Tentar com outro endereço
          </Button>
        </section>
        <div>
          <ButtonLink variant="primary" wide to={authPath('/entrar', returnTo)}>
            Voltar para entrar
          </ButtonLink>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Recupere seu acesso" lead="Informe o e-mail usado para acessar os vídeos.">
      <form className="surface auth-card" onSubmit={handleSubmit} noValidate>
        <h2 className="heading">E-mail de acesso</h2>
        {formError && <Message ref={alertRef} tone="error" title={formError} />}
        <TextField
          ref={emailRef}
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Digite seu e-mail"
          hint='Enviaremos as orientações de recuperação, se houver uma conta.'
          error={error}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Button type="submit" variant="primary" block loading={submitting} loadingLabel="Enviando">
          Enviar orientações
        </Button>
        <ButtonLink variant="secondary" block to={authPath('/entrar', returnTo)}>
          Voltar para entrar
        </ButtonLink>
      </form>
    </Page>
  );
}
