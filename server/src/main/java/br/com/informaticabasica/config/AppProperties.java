package br.com.informaticabasica.config;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configurações da aplicação (prefixo {@code app}). */
@ConfigurationProperties("app")
public record AppProperties(
    String publicBaseUrl,
    String adminEmails,
    Session session,
    PasswordReset passwordReset,
    Mail mail,
    Media media,
    Supabase supabase) {

  public record Session(String cookieName, Duration ttl, boolean cookieSecure) {}

  public record PasswordReset(Duration ttl) {}

  public record Mail(String from) {}

  public record Media(
      String videoProvider,
      String localDir,
      String signingSecret,
      Duration urlTtl,
      String supabaseBucket) {}

  public record Supabase(String url, String serviceRoleKey) {}

  /** Lista normalizada (minúsculas, sem espaços) dos e-mails com perfil de administração. */
  public List<String> adminEmailList() {
    if (adminEmails == null || adminEmails.isBlank()) {
      return List.of();
    }
    return Arrays.stream(adminEmails.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .map(s -> s.toLowerCase(Locale.ROOT))
        .toList();
  }
}
