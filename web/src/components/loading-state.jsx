export function LoadingState({ label = 'Carregando' }) {
  return (
    <main id="conteudo" className="page">
      <div className="container">
        <p className="loading" role="status">
          <span className="button__spinner" aria-hidden="true" />
          {label}…
        </p>
      </div>
    </main>
  );
}
