package br.com.informaticabasica.account;

import br.com.informaticabasica.auth.AppUser;
import br.com.informaticabasica.auth.AppUserRepository;
import br.com.informaticabasica.auth.AuthService;
import br.com.informaticabasica.auth.AuthenticatedUser;
import br.com.informaticabasica.auth.PasswordPolicy;
import br.com.informaticabasica.auth.Role;
import br.com.informaticabasica.auth.SessionService;
import br.com.informaticabasica.auth.UserSession;
import br.com.informaticabasica.common.ApiException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Operações do próprio usuário sobre seus dados de acesso e perfil. */
@Service
public class AccountService {

  private final AppUserRepository users;
  private final SessionService sessions;
  private final PasswordEncoder passwordEncoder;

  public AccountService(AppUserRepository users, SessionService sessions,
      PasswordEncoder passwordEncoder) {
    this.users = users;
    this.sessions = sessions;
    this.passwordEncoder = passwordEncoder;
  }

  public record AccountView(UUID id, String email, String fullName, String role,
      Instant createdAt, Instant lastLoginAt) {
    static AccountView of(AppUser u) {
      return new AccountView(u.getId(), u.getEmail(), u.getFullName(), u.getRole().name(),
          u.getCreatedAt(), u.getLastLoginAt());
    }
  }

  public record SessionView(UUID id, Instant createdAt, Instant lastSeenAt, String userAgent,
      boolean current) {}

  @Transactional(readOnly = true)
  public AccountView get(AuthenticatedUser principal) {
    return AccountView.of(load(principal));
  }

  @Transactional
  public AccountView update(AuthenticatedUser principal, String fullName, String email,
      String currentPassword) {
    AppUser user = load(principal);
    if (fullName != null) {
      String trimmed = fullName.trim().replaceAll("\\s+", " ");
      user.setFullName(trimmed.isEmpty() ? null : trimmed);
    }
    if (email != null) {
      String normalized = AuthService.normalizeEmail(email);
      if (!normalized.equals(user.getEmail())) {
        requirePassword(user, currentPassword, "currentPassword");
        if (users.existsByEmailIgnoreCase(normalized)) {
          throw new ApiException(HttpStatus.CONFLICT, "email_in_use",
              "Este e-mail já está em uso em outra conta.",
              Map.of("email", "Este e-mail já está em uso em outra conta."));
        }
        user.setEmail(normalized);
      }
    }
    return AccountView.of(users.saveAndFlush(user));
  }

  @Transactional
  public void changePassword(AuthenticatedUser principal, String currentPassword,
      String newPassword) {
    AppUser user = load(principal);
    requirePassword(user, currentPassword, "currentPassword");
    PasswordPolicy.validate(newPassword, "newPassword");
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    // Mantém este dispositivo conectado e encerra os demais.
    sessions.revokeOthers(user.getId(), principal.sessionId());
  }

  @Transactional(readOnly = true)
  public List<SessionView> sessions(AuthenticatedUser principal) {
    List<UserSession> active = sessions.activeSessions(principal.userId());
    return active.stream()
        .map(s -> new SessionView(s.getId(), s.getCreatedAt(), s.getLastSeenAt(), s.getUserAgent(),
            s.getId().equals(principal.sessionId())))
        .toList();
  }

  @Transactional
  public int revokeOtherSessions(AuthenticatedUser principal) {
    return sessions.revokeOthers(principal.userId(), principal.sessionId());
  }

  @Transactional
  public void delete(AuthenticatedUser principal, String password) {
    AppUser user = load(principal);
    requirePassword(user, password, "password");
    if (user.getRole() == Role.ADMIN
        && users.countByRole(Role.ADMIN) <= 1) {
      throw ApiException.badRequest("last_admin",
          "Esta é a única conta de administração. Defina outra antes de excluir esta conta.");
    }
    users.delete(user);
  }

  private AppUser load(AuthenticatedUser principal) {
    return users.findById(principal.userId())
        .orElseThrow(() -> ApiException.unauthorized("Entre para continuar."));
  }

  private void requirePassword(AppUser user, String password, String field) {
    if (password == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
      throw ApiException.field(field, "wrong_password", "A senha atual não confere.");
    }
  }
}
