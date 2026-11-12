package br.com.informaticabasica.auth;

import br.com.informaticabasica.common.ApiException;
import br.com.informaticabasica.common.AttemptLimiter;
import br.com.informaticabasica.common.ClientInfo;
import br.com.informaticabasica.common.Tokens;
import br.com.informaticabasica.config.AppProperties;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cadastro, login, logout e recuperação de acesso (E1). */
@Service
public class AuthService {

  static final String INVALID_CREDENTIALS =
      "E-mail ou senha não conferem. Confira os dados e tente novamente.";

  private final AppUserRepository users;
  private final PasswordResetTokenRepository resetTokens;
  private final SessionService sessions;
  private final PasswordEncoder passwordEncoder;
  private final PasswordResetMailer mailer;
  private final AppProperties properties;
  private final Clock clock;
  private final AttemptLimiter loginLimiter;
  private final AttemptLimiter resetLimiter;
  private final AttemptLimiter registerLimiter;
  private final AttemptLimiter ipGuard;
  /** Hash usado quando o e-mail não existe, para equalizar o tempo de resposta. */
  private final String dummyHash;

  public AuthService(AppUserRepository users, PasswordResetTokenRepository resetTokens,
      SessionService sessions, PasswordEncoder passwordEncoder, PasswordResetMailer mailer,
      AppProperties properties, Clock clock) {
    this.users = users;
    this.resetTokens = resetTokens;
    this.sessions = sessions;
    this.passwordEncoder = passwordEncoder;
    this.mailer = mailer;
    this.properties = properties;
    this.clock = clock;
    this.loginLimiter = new AttemptLimiter(5, Duration.ofMinutes(15), clock);
    this.resetLimiter = new AttemptLimiter(5, Duration.ofHours(1), clock);
    // Turmas em laboratório compartilham o mesmo IP: limite generoso por hora.
    this.registerLimiter = new AttemptLimiter(60, Duration.ofHours(1), clock);
    // Limite por IP mais alto, para não bloquear uma sala de aula inteira atrás do mesmo endereço.
    this.ipGuard = new AttemptLimiter(30, Duration.ofMinutes(15), clock);
    this.dummyHash = passwordEncoder.encode("informatica-basica-timing-guard");
  }

  public static String normalizeEmail(String email) {
    return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
  }

  @Transactional
  public SessionService.IssuedSession register(String rawEmail, String password, ClientInfo client) {
    String email = normalizeEmail(rawEmail);
    String ipKey = "register:ip:" + client.ipAddress();
    registerLimiter.check(ipKey);
    PasswordPolicy.validate(password, "password");
    registerLimiter.record(ipKey);
    if (users.existsByEmailIgnoreCase(email)) {
      throw new ApiException(HttpStatus.CONFLICT, "email_in_use",
          "Já existe uma conta com este e-mail. Entre ou recupere seu acesso.",
          Map.of("email", "Já existe uma conta com este e-mail."));
    }
    AppUser user = new AppUser(email, passwordEncoder.encode(password));
    if (properties.adminEmailList().contains(email)) {
      user.setRole(Role.ADMIN);
    }
    user.setLastLoginAt(clock.instant());
    try {
      users.saveAndFlush(user);
    } catch (DataIntegrityViolationException e) {
      throw ApiException.conflict("email_in_use",
          "Já existe uma conta com este e-mail. Entre ou recupere seu acesso.");
    }
    return sessions.create(user, client);
  }

  @Transactional
  public SessionService.IssuedSession login(String rawEmail, String password, ClientInfo client) {
    String email = normalizeEmail(rawEmail);
    String emailKey = "login:email:" + email;
    String ipKey = "login:ip:" + client.ipAddress();
    loginLimiter.check(emailKey);
    ipGuard.check(ipKey);

    AppUser user = users.findByEmailIgnoreCase(email).orElse(null);
    boolean matches = passwordEncoder.matches(password == null ? "" : password,
        user == null ? dummyHash : user.getPasswordHash());
    if (user == null || !matches) {
      loginLimiter.record(emailKey);
      ipGuard.record(ipKey);
      throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials", INVALID_CREDENTIALS);
    }
    if (!user.isActive()) {
      throw new ApiException(HttpStatus.FORBIDDEN, "account_disabled",
          "Esta conta está desativada. Procure a coordenação do curso.");
    }
    loginLimiter.reset(emailKey);
    user.setLastLoginAt(clock.instant());
    return sessions.create(user, client);
  }

  public void logout(String token) {
    sessions.revokeByToken(token);
  }

  /** Sempre conclui sem revelar se o e-mail possui conta. */
  @Transactional
  public void requestPasswordReset(String rawEmail, ClientInfo client) {
    String email = normalizeEmail(rawEmail);
    String emailKey = "reset:email:" + email;
    String ipKey = "reset:ip:" + client.ipAddress();
    resetLimiter.check(emailKey);
    ipGuard.check(ipKey);
    resetLimiter.record(emailKey);
    ipGuard.record(ipKey);

    users.findByEmailIgnoreCase(email).filter(AppUser::isActive).ifPresent(user -> {
      Instant now = clock.instant();
      resetTokens.invalidateOpenForUser(user.getId(), now);
      String token = Tokens.newToken();
      resetTokens.save(new PasswordResetToken(user, Tokens.sha256Hex(token), now,
          now.plus(properties.passwordReset().ttl())));
      mailer.send(user.getEmail(), token);
    });
  }

  @Transactional
  public void resetPassword(String token, String newPassword) {
    Instant now = clock.instant();
    PasswordResetToken reset = token == null || token.isBlank() || token.length() > 128
        ? null
        : resetTokens.findByTokenHash(Tokens.sha256Hex(token)).orElse(null);
    if (reset == null || !reset.isUsableAt(now) || !reset.getUser().isActive()) {
      throw ApiException.badRequest("invalid_token",
          "Este link de recuperação expirou ou já foi usado. Solicite um novo.");
    }
    PasswordPolicy.validate(newPassword, "password");
    AppUser user = reset.getUser();
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    reset.markUsed(now);
    // Uma nova senha encerra as sessões abertas em outros dispositivos.
    sessions.revokeAll(user.getId());
    loginLimiter.reset("login:email:" + user.getEmail());
  }

  /** Limpeza periódica dos contadores em memória. */
  public void cleanupLimiters() {
    loginLimiter.cleanup();
    resetLimiter.cleanup();
    registerLimiter.cleanup();
    ipGuard.cleanup();
  }
}
