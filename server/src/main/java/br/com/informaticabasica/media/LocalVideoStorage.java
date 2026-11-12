package br.com.informaticabasica.media;

import br.com.informaticabasica.catalog.Lesson;
import br.com.informaticabasica.common.Tokens;
import br.com.informaticabasica.config.AppProperties;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Vídeos em um diretório do servidor (volume Docker), entregues por URL assinada e temporária.
 * Coloque os arquivos como {@code <MEDIA_DIR>/m02-a02.mp4}.
 */
@Component
@ConditionalOnProperty(name = "app.media.video-provider", havingValue = "local", matchIfMissing = true)
public class LocalVideoStorage implements VideoUrlProvider {

  private static final Logger log = LoggerFactory.getLogger(LocalVideoStorage.class);

  private final Path baseDir;
  private final UrlSigner signer;
  private final Duration ttl;
  private final Clock clock;

  public LocalVideoStorage(AppProperties properties, Clock clock) {
    AppProperties.Media media = properties.media();
    this.baseDir = Path.of(media.localDir()).toAbsolutePath().normalize();
    this.ttl = media.urlTtl();
    this.clock = clock;
    String secret = media.signingSecret();
    if (secret == null || secret.isBlank()) {
      log.warn("MEDIA_SIGNING_SECRET não definido: usando chave temporária. "
          + "Endereços de vídeo deixam de valer quando a API reinicia.");
      secret = Tokens.newToken();
    }
    this.signer = new UrlSigner(Tokens.sha256Hex(secret).getBytes(StandardCharsets.US_ASCII));
    log.info("Vídeos locais em {}", baseDir);
  }

  @Override
  public VideoLink linkFor(Lesson lesson) {
    resolveFile(lesson).orElseThrow(() ->
        new VideoUnavailableException("Arquivo de vídeo ausente para " + lesson.getId()));
    Instant expiresAt = clock.instant().plus(ttl);
    long exp = expiresAt.getEpochSecond();
    String url = "/api/media/videos/" + lesson.getId() + "?exp=" + exp + "&sig="
        + signer.sign(lesson.getId(), exp);
    return new VideoLink(url, expiresAt);
  }

  /** Retorna o arquivo somente se a assinatura for válida e o prazo não tiver terminado. */
  public Optional<Path> verifiedFile(Lesson lesson, long exp, String sig) {
    if (exp < clock.instant().getEpochSecond() || !signer.verify(lesson.getId(), exp, sig)) {
      return Optional.empty();
    }
    return resolveFile(lesson);
  }

  private Optional<Path> resolveFile(Lesson lesson) {
    String name = lesson.getVideoObjectPath();
    if (name == null || name.isBlank()) {
      return Optional.empty();
    }
    Path file = baseDir.resolve(name).normalize();
    if (!file.startsWith(baseDir) || !Files.isRegularFile(file) || !Files.isReadable(file)) {
      return Optional.empty();
    }
    return Optional.of(file);
  }
}
