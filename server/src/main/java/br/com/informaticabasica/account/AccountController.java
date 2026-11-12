package br.com.informaticabasica.account;

import br.com.informaticabasica.auth.AuthenticatedUser;
import br.com.informaticabasica.auth.SessionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** "Minha conta": o usuário consulta e altera os próprios dados. */
@RestController
@RequestMapping("/api/account")
public class AccountController {

  private final AccountService account;
  private final SessionService sessions;

  public AccountController(AccountService account, SessionService sessions) {
    this.account = account;
    this.sessions = sessions;
  }

  public record UpdateRequest(
      @Size(max = 120, message = "Use um nome com até 120 caracteres.") String fullName,
      @Email(message = "Digite um e-mail válido, como nome@exemplo.com.")
      @Size(max = 254, message = "Use um e-mail com até 254 caracteres.") String email,
      String currentPassword) {}

  public record PasswordChange(
      @NotBlank(message = "Informe sua senha atual.") String currentPassword,
      @NotBlank(message = "Crie uma nova senha.") String newPassword) {}

  public record PasswordConfirmation(
      @NotBlank(message = "Informe sua senha para confirmar.") String password) {}

  @GetMapping
  public AccountService.AccountView get(@AuthenticationPrincipal AuthenticatedUser user) {
    return account.get(user);
  }

  @PatchMapping
  public AccountService.AccountView update(@AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody UpdateRequest body) {
    return account.update(user, body.fullName(), body.email(), body.currentPassword());
  }

  @PutMapping("/password")
  public ResponseEntity<Void> changePassword(@AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody PasswordChange body) {
    account.changePassword(user, body.currentPassword(), body.newPassword());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/sessions")
  public List<AccountService.SessionView> sessions(@AuthenticationPrincipal AuthenticatedUser user) {
    return account.sessions(user);
  }

  @PostMapping("/sessions/revoke-others")
  public Map<String, Integer> revokeOthers(@AuthenticationPrincipal AuthenticatedUser user) {
    return Map.of("revoked", account.revokeOtherSessions(user));
  }

  @DeleteMapping
  public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user,
      @Valid @RequestBody PasswordConfirmation body) {
    account.delete(user, body.password());
    return ResponseEntity.noContent()
        .header(HttpHeaders.SET_COOKIE, sessions.clearedCookie().toString())
        .build();
  }
}
