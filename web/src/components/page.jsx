import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

let firstRender = true;

/**
 * Estrutura comum das páginas: título (h1) e subtítulo. Ao navegar entre rotas,
 * o foco vai para o título, para que leitores de tela anunciem a nova página.
 */
export function Page({ title, lead, documentTitle, children, before, focusKey }) {
  const headingRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = `${documentTitle ?? title} • Informática Básica`;
  }, [documentTitle, title]);

  useEffect(() => {
    if (firstRender) {
      firstRender = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [pathname, focusKey]);

  return (
    <main id="conteudo" className="page">
      <div className="container page__inner">
        {before}
        <h1 ref={headingRef} className="page__title" tabIndex={-1}>
          {title}
        </h1>
        {lead && <p className="page__lead">{lead}</p>}
        {children}
      </div>
    </main>
  );
}
