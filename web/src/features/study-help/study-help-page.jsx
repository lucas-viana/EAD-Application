import { Page } from '../../components/page.jsx';
import { ButtonLink } from '../../components/button.jsx';
import { ContentCard } from '../../components/content-card.jsx';

const WAYS = [
  {
    title: 'Leia e observe',
    description:
      'O texto apresenta conceitos e exemplos explicados. Você pode voltar à mesma aula sempre que precisar.',
  },
  {
    title: 'Assista no seu ritmo',
    description: 'Entre para abrir os vídeos. Pause, retome e utilize legendas ou transcrição.',
  },
  {
    title: 'Ouça e visualize',
    description: 'O podcast e o infográfico sintetizam os principais pontos de cada módulo.',
  },
];

/** Apoio ao autoaprendizado (E5): orientações de estudo, sem exercícios ou correção. */
export function StudyHelpPage() {
  return (
    <Page title="Como estudar" lead="Escolha o formato que combina com o seu momento.">
      <ul className="card-grid card-grid--3" role="list">
        {WAYS.map((way) => (
          <li key={way.title}>
            <ContentCard
              headingLevel={2}
              title={way.title}
              description={way.description}
              action="Explorar módulos"
              to="/modulos"
            />
          </li>
        ))}
      </ul>
      <section className="surface" aria-labelledby="dispositivos">
        <h2 id="dispositivos" className="heading">
          No celular ou no computador
        </h2>
        <p>
          Os materiais podem ser consultados nos dois dispositivos. As demonstrações de arquivos,
          documentos e planilhas mostram o uso de um computador.
        </p>
      </section>
      <section className="surface" aria-labelledby="acesso">
        <h2 id="acesso" className="heading">
          Acesso aos materiais
        </h2>
        <p>
          Texto, podcast e infográfico são públicos. O login é solicitado apenas para assistir aos
          vídeos. Você não precisa enviar respostas ou arquivos.
        </p>
      </section>
      <div>
        <ButtonLink variant="primary" wide to="/modulos">
          Explorar os módulos
        </ButtonLink>
      </div>
    </Page>
  );
}
