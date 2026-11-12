import { useEffect, useRef, useState } from 'react';
import { Button, ButtonLink } from '../../components/button.jsx';
import { useSession } from '../auth/session-context.jsx';
import { authPath, lessonReturnTo } from '../auth/return-to.js';
import { getVideo } from '../../services/videos.js';

/**
 * Vídeo da aula (E3). Sem sessão: acesso restrito com retorno à mesma aula.
 * Com sessão: capa → carregando → reprodução; falha → indisponível, com alternativa pelo texto.
 * Ao sair, o componente é desmontado e o player é interrompido.
 */
export function VideoPlayer({ lesson, onReadSupport, onReadText }) {
  const { isAuthenticated, markSignedOut } = useSession();
  const [state, setState] = useState('idle');
  const [source, setSource] = useState(null);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const headingId = `video-${lesson.id}`;
  const cover = lesson.videoCover ?? { title: lesson.title, caption: '' };

  // Troca de aula: volta ao estado inicial.
  useEffect(() => {
    setState('idle');
    setSource(null);
    setPlaying(false);
  }, [lesson.id]);

  // Sessão encerrada: interrompe o player.
  useEffect(() => {
    if (!isAuthenticated) {
      videoRef.current?.pause();
      setSource(null);
      setState('idle');
    }
  }, [isAuthenticated]);

  const load = async () => {
    setState('loading');
    try {
      const video = await getVideo(lesson.id);
      setSource(video);
      setState('ready');
    } catch (error) {
      if (error.status === 401) {
        markSignedOut();
        return;
      }
      setState('unavailable');
    }
  };

  const togglePlayback = () => {
    const element = videoRef.current;
    if (!element) {
      return;
    }
    if (element.paused) {
      element.play().catch(() => setState('unavailable'));
    } else {
      element.pause();
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="surface surface--dark video-panel" aria-labelledby={headingId}>
        <h2 id={headingId} className="heading">
          Vídeo da aula
        </h2>
        <p className="video-panel__title">Entre para assistir ao vídeo</p>
        <p>
          O acesso identifica sua visita e libera os vídeos. Os demais materiais estão disponíveis
          abaixo.
        </p>
        <div>
          <ButtonLink variant="accent" wide to={authPath('/entrar', lessonReturnTo(lesson.id))}>
            Entrar para assistir
          </ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <section
      className="surface surface--dark video-panel"
      aria-labelledby={headingId}
      aria-busy={state === 'loading' || undefined}
    >
      <h2 id={headingId} className="heading">
        Vídeo da aula
      </h2>

      {state === 'idle' && (
        <>
          <div className="video-cover" aria-hidden="true">
            <p className="text-label">{cover.title}</p>
            {cover.caption && <p className="video-cover__caption">{cover.caption}</p>}
          </div>
          <p className="text-caption">00:00 / até 03:00</p>
          <div className="row">
            <Button variant="secondary" wide onClick={load}>
              Reproduzir vídeo
            </Button>
            <Button variant="secondary" wide onClick={onReadSupport}>
              Ler texto de apoio
            </Button>
          </div>
        </>
      )}

      {state === 'loading' && (
        <div className="video-cover video-cover--loading" role="status">
          <p className="text-label">Carregando vídeo</p>
          <p>Aguarde um instante. Os outros materiais continuam disponíveis.</p>
        </div>
      )}

      {state === 'ready' && source && (
        <>
          <video
            ref={videoRef}
            className="video-panel__video"
            src={source.url}
            controls
            autoPlay
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setState('unavailable')}
          >
            {lesson.captions && (
              <track kind="captions" src={lesson.captions} srcLang="pt-BR" label="Português" default />
            )}
            Seu navegador não reproduz este vídeo. Use o texto de apoio da aula.
          </video>
          <div className="row">
            <Button variant="secondary" wide onClick={togglePlayback} aria-pressed={playing}>
              {playing ? 'Pausar vídeo' : 'Continuar vídeo'}
            </Button>
            <Button variant="secondary" wide onClick={onReadSupport}>
              Ler texto de apoio
            </Button>
          </div>
        </>
      )}

      {state === 'unavailable' && (
        <div className="stack" role="alert">
          <p className="video-panel__title">O vídeo não carregou</p>
          <p>Você pode tentar novamente ou continuar pelo texto da aula.</p>
          <div className="row">
            <Button variant="secondary" wide onClick={load}>
              Tentar novamente
            </Button>
            <Button variant="secondary" wide onClick={onReadText}>
              Ler o texto da aula
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
