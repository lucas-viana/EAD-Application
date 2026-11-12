import { Page } from '../../components/page.jsx';
import { ContentCard } from '../../components/content-card.jsx';
import { getModules, twoDigits } from '../../content/index.js';

/** Catálogo: seis temas. Ler, ouvir e consultar infográficos não exige login. */
export function CatalogPage() {
  const modules = getModules();
  return (
    <Page
      title="Explore os módulos"
      documentTitle="Módulos"
      lead="Seis temas para conhecer melhor o computador. Não é necessário entrar para ler, ouvir ou consultar os infográficos."
    >
      <ul className="card-grid card-grid--3" role="list">
        {modules.map((module) => (
          <li key={module.id}>
            <ContentCard
              headingLevel={2}
              title={`${twoDigits(module.order)} · ${module.title}`}
              description={module.objective}
              action={`Ver as ${module.lessons.length} aulas`}
              to={`/modulos/${module.id}`}
            />
          </li>
        ))}
      </ul>
    </Page>
  );
}
