package br.com.informaticabasica.media;

import br.com.informaticabasica.catalog.Lesson;
import java.time.Instant;

/**
 * Emite um endereço temporário para o vídeo de uma aula (E3 com E1).
 * Um endereço já emitido pode valer até {@code expiresAt}; não há revogação instantânea.
 */
public interface VideoUrlProvider {

  VideoLink linkFor(Lesson lesson);

  record VideoLink(String url, Instant expiresAt) {}

  /** O arquivo do vídeo não existe ou o armazenamento não respondeu. Resulta em 503. */
  class VideoUnavailableException extends RuntimeException {
    public VideoUnavailableException(String message) {
      super(message);
    }
  }
}
