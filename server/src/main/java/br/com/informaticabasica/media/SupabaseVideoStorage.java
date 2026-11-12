package br.com.informaticabasica.media;

import br.com.informaticabasica.catalog.Lesson;
import br.com.informaticabasica.config.AppProperties;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriUtils;

/**
 * Vídeos em um bucket privado do Supabase Storage. A API gera URLs assinadas com a service role key,
 * que fica somente no servidor.
 */
@Component
@ConditionalOnProperty(name = "app.media.video-provider", havingValue = "supabase")
public class SupabaseVideoStorage implements VideoUrlProvider {

  private static final Logger log = LoggerFactory.getLogger(SupabaseVideoStorage.class);

  private final RestClient client;
  private final String baseUrl;
  private final String bucket;
  private final Duration ttl;
  private final Clock clock;

  record SignResponse(String signedURL) {}

  public SupabaseVideoStorage(AppProperties properties, Clock clock) {
    AppProperties.Supabase supabase = properties.supabase();
    if (supabase.url() == null || supabase.url().isBlank()
        || supabase.serviceRoleKey() == null || supabase.serviceRoleKey().isBlank()) {
      throw new IllegalStateException(
          "VIDEO_PROVIDER=supabase exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
    }
    this.baseUrl = supabase.url().replaceAll("/+$", "");
    this.bucket = properties.media().supabaseBucket();
    this.ttl = properties.media().urlTtl();
    this.clock = clock;
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(Duration.ofSeconds(5));
    factory.setReadTimeout(Duration.ofSeconds(10));
    this.client = RestClient.builder()
        .requestFactory(factory)
        .baseUrl(baseUrl + "/storage/v1")
        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + supabase.serviceRoleKey())
        .defaultHeader("apikey", supabase.serviceRoleKey())
        .build();
  }

  @Override
  public VideoLink linkFor(Lesson lesson) {
    String path = lesson.getVideoObjectPath();
    if (path == null || path.isBlank()) {
      throw new VideoUnavailableException("Aula sem vídeo cadastrado: " + lesson.getId());
    }
    Instant expiresAt = clock.instant().plus(ttl);
    try {
      SignResponse response = client.post()
          .uri("/object/sign/" + UriUtils.encodePath(bucket + "/" + path, "UTF-8"))
          .contentType(MediaType.APPLICATION_JSON)
          .body(Map.of("expiresIn", ttl.toSeconds()))
          .retrieve()
          .body(SignResponse.class);
      if (response == null || response.signedURL() == null) {
        throw new VideoUnavailableException("Resposta sem signedURL para " + lesson.getId());
      }
      return new VideoLink(baseUrl + "/storage/v1" + response.signedURL(), expiresAt);
    } catch (RestClientException e) {
      log.warn("Supabase Storage não emitiu URL para {}: {}", lesson.getId(), e.getMessage());
      throw new VideoUnavailableException("Falha ao assinar vídeo de " + lesson.getId());
    }
  }
}
