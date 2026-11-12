import { Page } from '../../components/page.jsx';
import { Button } from '../../components/button.jsx';
import { ContentCard } from '../../components/content-card.jsx';

/** Texto de apoio ao vídeo: explicação e exemplo; transcrição, quando publicada, separada. */
export function SupportTextView({ lesson, module, onBack }) {
  return (
    <Page
      title="Texto de apoio ao vídeo"
      lead={`${lesson.title} · Módulo ${module.order} · Aula ${lesson.order}`}
      focusKey="texto-de-apoio"
    >
      <section className="surface" aria-labelledby="apoio-explicacao">
        <h2 id="apoio-explicacao" className="heading">
          {lesson.supportHeading ?? 'Explicação'}
        </h2>
        <p className="prose">{lesson.description}</p>
      </section>
      <section className="surface" aria-labelledby="apoio-exemplo">
        <h2 id="apoio-exemplo" className="heading">
          {lesson.exampleHeading ?? 'Exemplo explicado'}
        </h2>
        <p className="prose">{lesson.workedExample}</p>
      </section>
      {lesson.transcript && (
        <section className="surface" aria-labelledby="apoio-transcricao">
          <h2 id="apoio-transcricao" className="heading">
            Transcrição do vídeo
          </h2>
          <p className="prose">{lesson.transcript}</p>
        </section>
      )}
      <div>
        <Button variant="secondary" wide onClick={onBack}>
          Voltar ao vídeo
        </Button>
      </div>
    </Page>
  );
}

export function PodcastTranscriptView({ module, onBack }) {
  return (
    <Page
      title="Transcrição do podcast"
      lead={`Módulo ${module.order} · ${module.title}`}
      focusKey="transcricao-podcast"
    >
      {module.podcast.transcript.map((part, index) => (
        <section key={part.heading} className="surface" aria-labelledby={`parte-${index}`}>
          <h2 id={`parte-${index}`} className="heading">
            {part.heading}
          </h2>
          <p className="prose">{part.text}</p>
        </section>
      ))}
      <div>
        <Button variant="secondary" wide onClick={onBack}>
          Voltar ao podcast
        </Button>
      </div>
    </Page>
  );
}

/** Infográfico do módulo, ampliado e com descrição equivalente. */
export function InfographicView({ module, onBack }) {
  const { infographic } = module;
  return (
    <Page
      title={infographic.title}
      lead={`Infográfico do módulo ${module.order} · acesso livre`}
      focusKey="infografico"
    >
      {infographic.src ? (
        <figure className="surface">
          <img src={infographic.src} alt={infographic.alt ?? infographic.title} />
        </figure>
      ) : (
        <>
          <section className="surface" aria-labelledby="info-principal">
            <h2 id="info-principal" className="heading">
              {infographic.main.title}
            </h2>
            <p>{infographic.main.text}</p>
            <ul className="card-grid infographic__items" role="list">
              {infographic.items.map((item) => (
                <li key={item.title}>
                  <ContentCard title={item.title} description={item.text} action={item.tag} />
                </li>
              ))}
            </ul>
          </section>
          <section className="surface" aria-labelledby="info-destaque">
            <h2 id="info-destaque" className="heading">
              {infographic.highlight.title}
            </h2>
            <p>{infographic.highlight.text}</p>
          </section>
        </>
      )}
      <section className="surface" aria-labelledby="info-descricao">
        <h2 id="info-descricao" className="heading">
          Descrição do infográfico
        </h2>
        <p className="prose">{infographic.longDescription}</p>
      </section>
      <div>
        <Button variant="secondary" wide onClick={onBack}>
          Voltar à aula
        </Button>
      </div>
    </Page>
  );
}
