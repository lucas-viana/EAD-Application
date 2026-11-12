package br.com.informaticabasica.auth;

import br.com.informaticabasica.common.ClientInfo;
import br.com.informaticabasica.common.Tokens;
import br.com.informaticabasica.config.AppProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cria, valida e encerra sessões persistidas no banco (sobrevivem ao reinício da API). */
@Service
public class SessionService {

  /** Evita uma escrita no banco a cada requisição: atualiza last_seen_at no máximo a cada 5 min. */
  private static final Duration TOUCH_INTERVAL = Duration.ofMinutes(5);

  private final UserSessionRepository sessions;
  private final AppProperties.Session config;
  private final Clock clock;

  public SessionService(UserSessionRepository sessions, AppProperties properties, Clock clock) {
    this.sessions = sessions;
    this.config = properties.session();
    this.clock = clock;
  }

  public record IssuedSession(UserSession session, String token) {}

  @Transactional
  public IssuedSession create(AppUser user, ClientInfo client) {
    String token = Tokens.newToken();
    Instant now = clock.instant();
    UserSession session = new UserSession(user, Tokens.sha256Hex(token), now,
        now.plus(config.ttl()), client.userAgent(), client.ipAddress());
    sessions.save(session);
    return new IssuedSession(session, token);
  }

  @Transactional
  public Optional<AuthenticatedUser> resolve(String token) {
    if (token == null || token.isBlank() || token.length() > 128) {
      return Optional.empty();
    }
    Instant now = clock.instant();
    return sessions.findByTokenHash(Tokens.sha256Hex(token))
        .filter(s -> s.isValidAt(now))
        .filter(s -> s.getUser().isActive())
        .map(s -> {
          if (Duration.between(s.getLastSeenAt(), now).compareTo(TOUCH_INTERVAL) > 0) {
            s.setLastSeenAt(now);
          }
          AppUser u = s.getUser();
          return new AuthenticatedUser(u.getId(), s.getId(), u.getEmail(), u.getRole());
        });
  }

  @Transactional
  public void revokeByToken(String token) {
    if (token == null || token.isBlank()) {
      return;
    }
    sessions.findByTokenHash(Tokens.sha256Hex(token)).ifPresent(s -> s.revoke(clock.instant()));
  }

  @Transactional
  public void revoke(UUID sessionId) {
    sessions.findById(sessionId).ifPresent(s -> s.revoke(clock.instant()));
  }

  @Transactional
  public int revokeAll(UUID userId) {
    return sessions.revokeAllForUser(userId, clock.instant());
  }

  @Transactional
  public int revokeOthers(UUID userId, UUID keepSessionId) {
    return sessions.revokeOthersForUser(userId, keepSessionId, clock.instant());
  }

  @Transactional(readOnly = true)
  public List<UserSession> activeSessions(UUID userId) {
    return sessions.findActiveByUser(userId, clock.instant());
  }

  public Optional<String> readToken(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return Optional.empty();
    }
    return Arrays.stream(cookies)
        .filter(c -> config.cookieName().equals(c.getName()))
        .map(Cookie::getValue)
        .findFirst();
  }

  public ResponseCookie sessionCookie(String token) {
    return baseCookie(token).maxAge(config.ttl()).build();
  }

  public ResponseCookie clearedCookie() {
    return baseCookie("").maxAge(Duration.ZERO).build();
  }

  private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
    return ResponseCookie.from(config.cookieName(), value)
        .httpOnly(true)
        .secure(config.cookieSecure())
        .sameSite("Lax")
        .path("/");
  }
}
