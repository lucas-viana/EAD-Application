package br.com.informaticabasica.auth;

import br.com.informaticabasica.common.ApiException;
import java.nio.charset.StandardCharsets;

/** Regras de senha compartilhadas por cadastro, troca e recuperação. */
public final class PasswordPolicy {

  public static final int MIN_LENGTH = 8;
  public static final int MAX_LENGTH = 64;
  /** Limite do algoritmo BCrypt. */
  private static final int MAX_BYTES = 72;

  private PasswordPolicy() {}

  public static void validate(String password, String field) {
    if (password == null || password.length() < MIN_LENGTH) {
      throw ApiException.field(field, "weak_password",
          "Use uma senha com pelo menos " + MIN_LENGTH + " caracteres.");
    }
    if (password.length() > MAX_LENGTH || password.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
      throw ApiException.field(field, "password_too_long",
          "Use uma senha com até " + MAX_LENGTH + " caracteres.");
    }
    if (password.isBlank()) {
      throw ApiException.field(field, "weak_password", "A senha não pode conter apenas espaços.");
    }
  }
}
