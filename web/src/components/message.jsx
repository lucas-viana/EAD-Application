import { forwardRef } from 'react';

/** Message / Success · Warning · Error · Info. Erros são anunciados por leitores de tela. */
export const Message = forwardRef(function Message({ tone = 'info', title, children }, ref) {
  const role = tone === 'error' ? 'alert' : 'status';
  return (
    <div ref={ref} className={`message message--${tone}`} role={role} tabIndex={-1}>
      {title && <p className="message__title">{title}</p>}
      {children && <div>{children}</div>}
    </div>
  );
});
