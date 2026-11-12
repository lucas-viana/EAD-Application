import { Link } from 'react-router';

const classes = ({ variant = 'secondary', wide, block, className }) =>
  ['button', `button--${variant}`, wide && 'button--wide', block && 'button--block', className]
    .filter(Boolean)
    .join(' ');

/**
 * Button / Accent e variantes (primary, secondary, accent, danger).
 * loading mantém o rótulo legível e informa o estado a leitores de tela.
 */
export function Button({
  variant,
  wide,
  block,
  className,
  loading = false,
  loadingLabel,
  children,
  type = 'button',
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      className={classes({ variant, wide, block, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="button__spinner" aria-hidden="true" />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

/** Ação de navegação com aparência de botão (Navigation / Item). */
export function ButtonLink({ variant, wide, block, className, children, ...props }) {
  return (
    <Link className={classes({ variant, wide, block, className })} {...props}>
      {children}
    </Link>
  );
}
