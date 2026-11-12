import { useParams } from 'react-router';
import { Page } from '../../components/page.jsx';
import { ButtonLink } from '../../components/button.jsx';
import { ContentCard } from '../../components/content-card.jsx';
import { getModule, getModules, twoDigits } from '../../content/index.js';
import { NotFoundPage } from './not-found-page.jsx';

/** Página do módulo (m01…m06): objetivo e lista das três aulas. */
export function ModulePage() {
  const { moduleId } = useParams();
  const module = getModule(moduleId);
  if (!module) {
    return <NotFoundPage />;
  }
  const total = getModules().length;

  return (
    <Page title={module.title} lead={`Módulo ${module.order} de ${total} · ${module.lessons.length} aulas`}>
      <div>
        <ButtonLink variant="secondary" to="/modulos" className="button--fit">
          Todos os módulos
        </ButtonLink>
      </div>
      <section className="surface" aria-labelledby="objetivo">
        <h2 id="objetivo" className="heading">
          O que você vai conhecer
        </h2>
        <p>{module.objective}</p>
      </section>
      <section className="stack stack--24" aria-labelledby="aulas">
        <h2 id="aulas" className="section-title">
          Aulas deste módulo
        </h2>
        <ol className="card-grid card-grid--3" role="list">
          {module.lessons.map((lesson) => (
            <li key={lesson.id}>
              <ContentCard
                title={`${twoDigits(lesson.order)} · ${lesson.title}`}
                description={lesson.topics}
                action="Abrir aula"
                to={`/aulas/${lesson.id}`}
              />
            </li>
          ))}
        </ol>
      </section>
      <p className="text-caption module-credits">{module.credits}</p>
    </Page>
  );
}
