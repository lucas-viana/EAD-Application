import { Page } from '../../components/page.jsx';
import { ButtonLink } from '../../components/button.jsx';
import { ContentCard } from '../../components/content-card.jsx';
import { IllustrationStudent } from '../../components/illustration-student.jsx';
import { useSession } from '../auth/session-context.jsx';

const FORMATS = [
  { title: 'Vídeo', description: 'Demonstrações curtas, de até 3 minutos. Entre para assistir.' },
  { title: 'Texto descritivo', description: 'Explicações e exemplos que você pode ler livremente.' },
  { title: 'Podcast', description: 'Ouça uma síntese dos principais pontos do módulo.' },
  { title: 'Infográfico', description: 'Visualize os conceitos e suas relações em uma síntese.' },
];

/** Apresentação: temas do curso e cadastro em três passos. */
export function HomePage() {
  const { isAuthenticated } = useSession();

  return (
    <Page
      title="Aprenda a usar o computador"
      documentTitle="Início"
      lead="Para quem está começando a usar o computador. Aprenda no seu ritmo."
    >
      <section className="surface surface--soft hero" aria-labelledby="hero-title">
        <div className="hero__text">
          <h2 id="hero-title" className="section-title">
            Seu primeiro passo no mundo digital
          </h2>
          <p className="hero__lead">
            Explore seis módulos com vídeos curtos, textos, podcasts e infográficos. Escolha por onde
            começar e volte aos materiais quando quiser.
          </p>
          <div className="hero__actions">
            {isAuthenticated ? (
              <>
                <ButtonLink variant="accent" wide to="/modulos">
                  Explorar os módulos
                </ButtonLink>
                <ButtonLink variant="secondary" wide to="/minha-conta">
                  Minha conta
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink variant="accent" wide to="/criar-acesso">
                  Criar minha conta
                </ButtonLink>
                <ButtonLink variant="secondary" wide to="/entrar">
                  Já tenho conta — Entrar
                </ButtonLink>
              </>
            )}
          </div>
        </div>
        <IllustrationStudent className="hero__illustration" />
      </section>

      <section className="stack" aria-labelledby="temas">
        <h2 id="temas" className="heading heading--regular">
          O que você vai aprender
        </h2>
        <p>
          Primeiros passos no computador • Arquivos e pastas • Internet e pesquisa • E-mail •
          Documentos de texto • Planilhas.
        </p>
        <h2 className="heading heading--regular">Como criar sua conta</h2>
        <ol className="steps">
          <li>Selecione Criar minha conta.</li>
          <li>Informe seu e-mail, crie uma senha e confirme.</li>
          <li>Depois do cadastro, escolha um módulo para começar.</li>
        </ol>
        <p>
          A conta libera os vídeos e permite registrar seus acessos às aulas. Textos, podcasts e
          infográficos ficam disponíveis sem login.
        </p>
        {!isAuthenticated && (
          <div>
            <ButtonLink variant="secondary" wide to="/modulos">
              Explorar sem criar conta
            </ButtonLink>
          </div>
        )}
      </section>

      <section className="stack stack--24" aria-labelledby="formatos">
        <h2 id="formatos" className="section-title">
          Quatro formas de aprender
        </h2>
        <div className="card-grid card-grid--4">
          {FORMATS.map((format) => (
            <ContentCard key={format.title} title={format.title} description={format.description} />
          ))}
        </div>
      </section>
    </Page>
  );
}
