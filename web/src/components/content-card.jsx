import { Link } from 'react-router';

/**
 * Learning / Content card: título, descrição e ação. A ação corresponde ao destino;
 * o estado nunca é comunicado apenas por cor.
 */
export function ContentCard({ title, description, action, to, current = false, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`;
  return (
    <article className={['content-card', current && 'content-card--current'].filter(Boolean).join(' ')}>
      <Heading className="content-card__title">
        {to ? (
          <Link className="content-card__link" to={to}>
            {title}
          </Link>
        ) : (
          title
        )}
      </Heading>
      {description && <p className="content-card__description">{description}</p>}
      {action && (
        <p className="content-card__action" aria-hidden={to ? true : undefined}>
          {action}
        </p>
      )}
    </article>
  );
}
