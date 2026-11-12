package br.com.informaticabasica.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Limpeza de sessões encerradas, tokens expirados e contadores de tentativas. */
@Component
public class MaintenanceJobs {

  private static final Logger log = LoggerFactory.getLogger(MaintenanceJobs.class);
  private static final Duration RETENTION = Duration.ofDays(30);

  private final UserSessionRepository sessions;
  private final PasswordResetTokenRepository resetTokens;
  private final AuthService auth;
  private final Clock clock;

  public MaintenanceJobs(UserSessionRepository sessions, PasswordResetTokenRepository resetTokens,
      AuthService auth, Clock clock) {
    this.sessions = sessions;
    this.resetTokens = resetTokens;
    this.auth = auth;
    this.clock = clock;
  }

  /** Diariamente às 03:15 (UTC). O registro de acessos é preservado sem o vínculo da sessão. */
  @Scheduled(cron = "0 15 3 * * *", zone = "UTC")
  @Transactional
  public void purgeExpired() {
    Instant cutoff = clock.instant().minus(RETENTION);
    int removedSessions = sessions.deleteFinishedBefore(cutoff);
    int removedTokens = resetTokens.deleteExpiredBefore(clock.instant());
    log.info("Limpeza: {} sessões e {} tokens de recuperação removidos", removedSessions,
        removedTokens);
  }

  @Scheduled(fixedDelay = 15 * 60 * 1000, initialDelay = 15 * 60 * 1000)
  public void cleanupLimiters() {
    auth.cleanupLimiters();
  }
}
