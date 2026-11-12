import { forwardRef, useId, useState } from 'react';

/**
 * Input / Accessible: rótulo permanente, orientação abaixo do campo e erro associado.
 * Estados: padrão, foco, erro e desabilitado.
 * error: texto do erro, ou true para destacar o campo mantendo a orientação (em vermelho).
 */
export const TextField = forwardRef(function TextField(
  { label, hint, error, type = 'text', className, ...inputProps },
  ref,
) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const errorText = typeof error === 'string' && error ? error : null;
  const flaggedOnly = error === true;
  const showHint = hint && !errorText;
  const describedBy = [showHint && hintId, errorText && errorId].filter(Boolean).join(' ') || undefined;

  const input = (
    <input
      ref={ref}
      id={id}
      className="field__control"
      type={isPassword && revealed ? 'text' : type}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      {...inputProps}
    />
  );

  return (
    <div className={['field', error && 'field--error', className].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {isPassword ? (
        <div className="field__password">
          {input}
          <button
            type="button"
            className="field__toggle"
            aria-pressed={revealed}
            aria-controls={id}
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? 'Ocultar' : 'Mostrar'}
            <span className="visually-hidden"> senha</span>
          </button>
        </div>
      ) : (
        input
      )}
      {showHint && (
        <p id={hintId} className={flaggedOnly ? 'field__error' : 'field__hint'}>
          {hint}
        </p>
      )}
      {errorText && (
        <p id={errorId} className="field__error">
          {errorText}
        </p>
      )}
    </div>
  );
});
