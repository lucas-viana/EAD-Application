package br.com.informaticabasica.common;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limite simples de tentativas em janela deslizante, em memória.
 * Suficiente para uma instância da API; com várias instâncias, mover para o banco ou um cache compartilhado.
 */
public class AttemptLimiter {

  private final int maxAttempts;
  private final Duration window;
  private final Clock clock;
  private final Map<String, Deque<Instant>> attempts = new ConcurrentHashMap<>();

  public AttemptLimiter(int maxAttempts, Duration window, Clock clock) {
    this.maxAttempts = maxAttempts;
    this.window = window;
    this.clock = clock;
  }

  /** Lança {@link TooManyAttemptsException} se alguma das chaves excedeu o limite. */
  public void check(String... keys) {
    Instant now = clock.instant();
    for (String key : keys) {
      Deque<Instant> deque = attempts.get(key);
      if (deque == null) {
        continue;
      }
      synchronized (deque) {
        prune(deque, now);
        if (deque.size() >= maxAttempts) {
          long retry = Math.max(1, Duration.between(now, deque.peekFirst().plus(window)).toSeconds());
          throw new TooManyAttemptsException(retry);
        }
      }
    }
  }

  public void record(String... keys) {
    Instant now = clock.instant();
    for (String key : keys) {
      Deque<Instant> deque = attempts.computeIfAbsent(key, k -> new ArrayDeque<>());
      synchronized (deque) {
        prune(deque, now);
        deque.addLast(now);
      }
    }
  }

  public void reset(String... keys) {
    for (String key : keys) {
      attempts.remove(key);
    }
  }

  /** Remove entradas antigas para não acumular memória. */
  public void cleanup() {
    Instant now = clock.instant();
    attempts.entrySet().removeIf(entry -> {
      synchronized (entry.getValue()) {
        prune(entry.getValue(), now);
        return entry.getValue().isEmpty();
      }
    });
  }

  private void prune(Deque<Instant> deque, Instant now) {
    Instant limit = now.minus(window);
    while (!deque.isEmpty() && deque.peekFirst().isBefore(limit)) {
      deque.pollFirst();
    }
  }
}
