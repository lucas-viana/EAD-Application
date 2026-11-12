import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/button.jsx';
import { Message } from '../../components/message.jsx';

/**
 * Podcast do módulo (E3). Pertence ao módulo e é reutilizado nas três aulas.
 * Estados: inicial, reprodução, pausado e indisponível. Acesso livre.
 */
export function PodcastPanel({ module, onReadTranscript }) {
  const { podcast } = module;
  const [state, setState] = useState('idle');
  const audioRef = useRef(null);

  useEffect(() => {
    setState('idle');
  }, [module.id]);

  const play = () => {
    const audio = audioRef.current;
    if (!audio || !podcast.src) {
      setState('unavailable');
      return;
    }
    audio.play().catch(() => setState('unavailable'));
  };

  const pause = () => audioRef.current?.pause();

  return (
    <section className="surface" id="podcast" aria-labelledby="podcast-title" tabIndex={-1}>
      <h2 id="podcast-title" className="heading">
        Podcast do módulo
      </h2>
      <p>{podcast.summary}</p>

      {podcast.src && (
        <audio
          ref={audioRef}
          src={podcast.src}
          preload="none"
          controls={state === 'playing' || state === 'paused'}
          className="podcast__audio"
          onPlay={() => setState('playing')}
          onPause={() => setState((current) => (current === 'unavailable' ? current : 'paused'))}
          onEnded={() => setState('idle')}
          onError={() => setState('unavailable')}
        />
      )}

      {state === 'paused' && (
        <p role="status">
          <strong>Podcast pausado.</strong> A reprodução continua do ponto em que você pausou.
        </p>
      )}
      {state === 'playing' && (
        <p role="status" className="visually-hidden">
          Reproduzindo o podcast do módulo.
        </p>
      )}
      {state === 'unavailable' && (
        <Message tone="warning" title="O áudio deste módulo ainda não está disponível.">
          A transcrição completa está liberada para leitura.
        </Message>
      )}

      <div className="row">
        {state === 'playing' ? (
          <Button variant="primary" wide onClick={pause}>
            Pausar podcast
          </Button>
        ) : state === 'paused' ? (
          <Button variant="primary" wide onClick={play}>
            Continuar podcast
          </Button>
        ) : state === 'idle' ? (
          <Button variant="primary" wide onClick={play}>
            Ouvir podcast
          </Button>
        ) : null}
        <Button variant="secondary" wide onClick={onReadTranscript}>
          Ler transcrição do podcast
        </Button>
      </div>
    </section>
  );
}
