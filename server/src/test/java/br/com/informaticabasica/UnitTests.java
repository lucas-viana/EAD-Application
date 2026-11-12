package br.com.informaticabasica;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.informaticabasica.auth.PasswordPolicy;
import br.com.informaticabasica.catalog.LessonIds;
import br.com.informaticabasica.common.ApiException;
import br.com.informaticabasica.common.AttemptLimiter;
import br.com.informaticabasica.common.TooManyAttemptsException;
import br.com.informaticabasica.media.UrlSigner;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class UnitTests {

  @Nested
  class UrlSignerTest {
    private final UrlSigner signer =
        new UrlSigner("0123456789abcdef0123456789abcdef".getBytes(StandardCharsets.US_ASCII));

    @Test
    void acceptsOwnSignature() {
      String sig = signer.sign("m02-a02", 1_900_000_000L);
      assertThat(signer.verify("m02-a02", 1_900_000_000L, sig)).isTrue();
    }

    @Test
    void rejectsOtherLessonOrExpiry() {
      String sig = signer.sign("m02-a02", 1_900_000_000L);
      assertThat(signer.verify("m02-a03", 1_900_000_000L, sig)).isFalse();
      assertThat(signer.verify("m02-a02", 1_900_000_001L, sig)).isFalse();
      assertThat(signer.verify("m02-a02", 1_900_000_000L, null)).isFalse();
    }
  }

  @Nested
  class AttemptLimiterTest {
    @Test
    void blocksAfterLimitAndReleasesAfterWindow() {
      AtomicReference<Instant> now = new AtomicReference<>(Instant.parse("2026-11-11T10:00:00Z"));
      Clock clock = new Clock() {
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return now.get(); }
      };
      AttemptLimiter limiter = new AttemptLimiter(3, Duration.ofMinutes(15), clock);
      for (int i = 0; i < 3; i++) {
        limiter.check("k");
        limiter.record("k");
      }
      assertThatThrownBy(() -> limiter.check("k")).isInstanceOf(TooManyAttemptsException.class);
      now.set(now.get().plus(Duration.ofMinutes(16)));
      limiter.check("k");
    }
  }

  @Nested
  class PasswordPolicyTest {
    @Test
    void rejectsShortAndLongPasswords() {
      assertThatThrownBy(() -> PasswordPolicy.validate("curta", "password"))
          .isInstanceOf(ApiException.class);
      assertThatThrownBy(() -> PasswordPolicy.validate("a".repeat(65), "password"))
          .isInstanceOf(ApiException.class);
      assertThatThrownBy(() -> PasswordPolicy.validate("        ", "password"))
          .isInstanceOf(ApiException.class);
      PasswordPolicy.validate("uma senha longa", "password");
    }
  }

  @Nested
  class LessonIdsTest {
    @Test
    void acceptsOnlyPublishedFormat() {
      assertThat(LessonIds.isWellFormed("m01-a01")).isTrue();
      assertThat(LessonIds.isWellFormed("m06-a03")).isTrue();
      assertThat(LessonIds.isWellFormed("m07-a01")).isFalse();
      assertThat(LessonIds.isWellFormed("m01-a04")).isFalse();
      assertThat(LessonIds.isWellFormed("../etc/passwd")).isFalse();
      assertThat(LessonIds.isWellFormed(null)).isFalse();
    }
  }
}
