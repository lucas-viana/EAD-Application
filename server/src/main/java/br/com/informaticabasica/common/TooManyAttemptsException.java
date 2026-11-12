package br.com.informaticabasica.common;

public class TooManyAttemptsException extends RuntimeException {

  private final long retryAfterSeconds;

  public TooManyAttemptsException(long retryAfterSeconds) {
    super("too_many_attempts");
    this.retryAfterSeconds = retryAfterSeconds;
  }

  public long retryAfterSeconds() {
    return retryAfterSeconds;
  }
}
