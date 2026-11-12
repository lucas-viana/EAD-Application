import { Page } from '../../components/page.jsx';
import { ButtonLink } from '../../components/button.jsx';

export function NotFoundPage() {
  return (
    <Page
      title="Página não encontrada"
      lead="O endereço pode ter mudado ou estar incompleto. Os materiais continuam disponíveis nos módulos."
    >
      <div className="row">
        <ButtonLink variant="primary" wide to="/modulos">
          Ver os módulos
        </ButtonLink>
        <ButtonLink variant="secondary" wide to="/">
          Ir para o início
        </ButtonLink>
      </div>
    </Page>
  );
}
