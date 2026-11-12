package br.com.informaticabasica.auth;

import java.time.Instant;
import java.util.UUID;

/** Dados do usuário expostos pela API. Nunca inclui hash de senha ou tokens. */
public record UserView(UUID id, String email, String fullName, Role role, Instant createdAt) {

  public static UserView of(AppUser user) {
    return new UserView(user.getId(), user.getEmail(), user.getFullName(), user.getRole(),
        user.getCreatedAt());
  }
}
