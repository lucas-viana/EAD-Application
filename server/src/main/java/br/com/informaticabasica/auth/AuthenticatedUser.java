package br.com.informaticabasica.auth;

import java.util.UUID;

/** Identidade validada pelo servidor para a requisição atual (E1 entrega para E3/E6). */
public record AuthenticatedUser(UUID userId, UUID sessionId, String email, Role role) {

  public boolean isAdmin() {
    return role == Role.ADMIN;
  }
}
