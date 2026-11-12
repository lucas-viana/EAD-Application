import { useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { Page } from '../../components/page.jsx';
import { Button, ButtonLink } from '../../components/button.jsx';
import { ContentCard } from '../../components/content-card.jsx';
import { getLesson, getLessonNeighbors, getModule, lessonLabel, twoDigits } from '../../content/index.js';
import { NotFoundPage } from '../catalog/not-found-page.jsx';
import { VideoPlayer } from '../resources/video-player.jsx';
import { PodcastPanel } from '../resources/podcast-panel.jsx';
import {
  InfographicView,
  PodcastTranscriptView,
  SupportTextView,
} from '../resources/resource-views.jsx';
import { useRecordAccess } from '../analytics/use-record-access.js';

const VIEWS = {
  support: 'texto-de-apoio',
  podcastTranscript: 'transcricao-podcast',
  infographic: 'infografico',
};

/**
 * Aula parametrizada por lessonId (E4). Uma única tela para as 18 aulas;
 * desktop e mobile compartilham o código. Recursos ampliados usam ?ver= e preservam a aula de origem.
 */
export function LessonPage() {
  const { lessonId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const lesson = getLesson(lessonId);
  const view = params.get('ver');
  const focusSection = location.state?.focusSection;

  useRecordAccess(lesson?.id);

  // Ao voltar de um recurso ampliado, devolve o foco à seção de origem.
  useEffect(() => {
    if (!view && focusSection) {
      const element = document.getElementById(focusSection);
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: 'start' });
    }
  }, [view, focusSection]);

  if (!lesson) {
    return <NotFoundPage />;
  }

  const module = getModule(lesson.moduleId);
  const { previous, next } = getLessonNeighbors(lesson.id);
  const openView = (name) => navigate({ search: `?ver=${name}` });
  const backToLesson = (section) => navigate({ search: '' }, { state: { focusSection: section } });

  if (view === VIEWS.support) {
    return <SupportTextView lesson={lesson} module={module} onBack={() => backToLesson('video')} />;
  }
  if (view === VIEWS.podcastTranscript) {
    return <PodcastTranscriptView module={module} onBack={() => backToLesson('podcast')} />;
  }
  if (view === VIEWS.infographic) {
    return <InfographicView module={module} onBack={() => backToLesson('infografico')} />;
  }

  const focusText = () => {
    const element = document.getElementById('texto-da-aula');
    element?.focus({ preventScroll: true });
    element?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  return (
    <Page title={lesson.title} lead={lessonLabel(lesson)} focusKey={lesson.id}>
      <div>
        <ButtonLink variant="secondary" to={`/modulos/${module.id}`}>
          Voltar ao módulo
        </ButtonLink>
      </div>

      <div className="lesson-layout">
        <div className="lesson-layout__main">
          <div id="video" tabIndex={-1}>
            <VideoPlayer
              lesson={lesson}
              onReadSupport={() => openView(VIEWS.support)}
              onReadText={focusText}
            />
          </div>

          <section className="surface" id="texto-da-aula" aria-labelledby="texto-titulo" tabIndex={-1}>
            <h2 id="texto-titulo" className="heading">
              Texto descritivo
            </h2>
            <p className="prose">{lesson.description}</p>
            <h3 className="text-label">Exemplo explicado</h3>
            <p className="prose">{lesson.workedExample}</p>
          </section>

          <PodcastPanel module={module} onReadTranscript={() => openView(VIEWS.podcastTranscript)} />

          <section
            className="surface"
            id="infografico"
            aria-labelledby="infografico-titulo"
            tabIndex={-1}
          >
            <h2 id="infografico-titulo" className="heading">
              Infográfico do módulo
            </h2>
            <p>{module.infographic.title}</p>
            <div>
              <Button variant="secondary" wide onClick={() => openView(VIEWS.infographic)}>
                Ampliar infográfico
              </Button>
            </div>
          </section>
        </div>

        <aside className="lesson-layout__aside" aria-labelledby="neste-modulo">
          <h2 id="neste-modulo" className="heading">
            Neste módulo
          </h2>
          <ol className="stack" role="list">
            {module.lessons.map((item) => {
              const current = item.id === lesson.id;
              return (
                <li key={item.id} aria-current={current ? 'page' : undefined}>
                  <ContentCard
                    title={`${twoDigits(item.order)} · ${item.title}`}
                    description={current ? 'Você está nesta aula.' : 'Vídeo e texto da aula.'}
                    action={current ? 'Aula aberta' : 'Abrir aula'}
                    to={current ? undefined : `/aulas/${item.id}`}
                    current={current}
                  />
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      <nav className="lesson-nav" aria-label="Navegação entre aulas">
        {previous ? (
          <ButtonLink variant="secondary" className="lesson-nav__button" to={`/aulas/${previous.id}`}>
            Aula anterior
          </ButtonLink>
        ) : (
          <ButtonLink variant="secondary" className="lesson-nav__button" to="/modulos">
            Todos os módulos
          </ButtonLink>
        )}
        {next ? (
          <ButtonLink variant="primary" className="lesson-nav__button" to={`/aulas/${next.id}`}>
            Próxima aula
          </ButtonLink>
        ) : (
          <ButtonLink variant="primary" className="lesson-nav__button" to={`/modulos/${module.id}`}>
            Voltar ao módulo
          </ButtonLink>
        )}
      </nav>
    </Page>
  );
}
