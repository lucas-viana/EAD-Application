import { useEffect, useId, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { Brand } from './brand.jsx';
import { Button, ButtonLink } from './button.jsx';
import { useSession } from '../features/auth/session-context.jsx';

const LINKS = [
  { to: '/', label: 'Início', end: true },
  { to: '/modulos', label: 'Módulos' },
  { to: '/como-estudar', label: 'Como estudar' },
];

function NavItem({ to, label, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className="button button--secondary site-nav__link"
    >
      {label}
    </NavLink>
  );
}

/** Cabeçalho comum (E2): marca, navegação e acesso. No celular, o menu abre um painel. */
export function SiteHeader() {
  const { isAuthenticated, isAdmin, logout } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuId = useId();
  const menuButtonRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const handleLogout = async () => {
    setLeaving(true);
    try {
      await logout();
    } finally {
      setLeaving(false);
      navigate('/');
    }
  };

  const accountLinks = isAuthenticated
    ? [
        ...(isAdmin ? [{ to: '/admin/usuarios', label: 'Usuários' }] : []),
        { to: '/minha-conta', label: 'Minha conta' },
      ]
    : [];

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <div className="container site-header__bar">
        <Brand />
        <span className="site-header__spacer" />
        <nav className="site-nav" aria-label="Principal">
          {[...LINKS, ...accountLinks].map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
          {isAuthenticated ? (
            <Button variant="primary" onClick={handleLogout} loading={leaving}>
              Sair
            </Button>
          ) : (
            <ButtonLink variant="primary" to="/entrar">
              Entrar
            </ButtonLink>
          )}
        </nav>
        <button
          ref={menuButtonRef}
          type="button"
          className="button button--secondary site-header__menu-button"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Fechar' : 'Menu'}
        </button>
      </div>
      <div id={menuId} className="site-menu" data-open={menuOpen}>
        <nav className="container stack stack--24" aria-label="Menu">
          <div className="stack stack--8">
            <p className="heading">Menu</p>
            <p className="page__lead">Encontre os materiais do curso.</p>
          </div>
          <ul className="site-menu__list">
            {[...LINKS, ...accountLinks].map((link) => (
              <li key={link.to}>
                <NavItem {...link} onNavigate={closeMenu} />
              </li>
            ))}
            <li>
              {isAuthenticated ? (
                <Button variant="primary" block onClick={handleLogout} loading={leaving}>
                  Sair
                </Button>
              ) : (
                <ButtonLink variant="primary" block to="/entrar" onClick={closeMenu}>
                  Entrar para ver vídeos
                </ButtonLink>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
