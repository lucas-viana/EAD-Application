package br.com.informaticabasica.auth;

import br.com.informaticabasica.common.ClientInfo;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Contrato E1: GET /api/session, POST /api/auth/login | register | logout | password-reset.
 */
@RestController
@RequestMapping("/api")
public class AuthController {

  private final AuthService auth;
  private final SessionService sessions;
  private final AppUserRepository users;

  public AuthController(AuthService auth, SessionService sessions, AppUserRepository users) {
    this.auth = auth;
    this.sessions = sessions;
    this.users = users;
  }

  public record Credentials(
      @NotBlank(message = "Informe seu e-mail.")
      @Email(message = "Digite um e-mail válido, como nome@exemplo.com.")
      @Size(max = 254, message = "Use um e-mail com até 254 caracteres.")
      String email,
      @NotBlank(message = "Informe sua senha.")
      String password) {}

  public record ResetRequest(
      @NotBlank(message = "Informe seu e-mail.")
      @Email(message = "Digite um e-mail válido, como nome@exemplo.com.")
      String email) {}

  public record ResetConfirmation(
      @NotBlank(message = "O link de recuperação está incompleto.") String token,
      @NotBlank(message = "Crie uma nova senha.") String password) {}

  public record SessionResponse(boolean authenticated, UserView user) {
    static SessionResponse anonymous() {
      return new SessionResponse(false, null);
    }
  }

  @GetMapping("/session")
  public SessionResponse session(@AuthenticationPrincipal AuthenticatedUser principal) {
    if (principal == null) {
      return SessionResponse.anonymous();
    }
    return users.findById(principal.userId())
        .map(u -> new SessionResponse(true, UserView.of(u)))
        .orElse(SessionResponse.anonymous());
  }

  @PostMapping("/auth/register")
  public ResponseEntity<SessionResponse> register(@Valid @RequestBody Credentials body,
      HttpServletRequest request) {
    var previousToken = sessions.readToken(request);
    SessionService.IssuedSession issued =
        auth.register(body.email(), body.password(), ClientInfo.from(request));
    previousToken.ifPresent(sessions::revokeByToken);
    return ResponseEntity.status(HttpStatus.CREATED)
        .header(HttpHeaders.SET_COOKIE, sessions.sessionCookie(issued.token()).toString())
        .body(new SessionResponse(true, UserView.of(issued.session().getUser())));
  }

  @PostMapping("/auth/login")
  public ResponseEntity<SessionResponse> login(@Valid @RequestBody Credentials body,
      HttpServletRequest request) {
    var previousToken = sessions.readToken(request);
    SessionService.IssuedSession issued =
        auth.login(body.email(), body.password(), ClientInfo.from(request));
    // Evita fixação de sessão: a sessão anterior deste navegador é encerrada após o novo login.
    previousToken.ifPresent(sessions::revokeByToken);
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, sessions.sessionCookie(issued.token()).toString())
        .body(new SessionResponse(true, UserView.of(issued.session().getUser())));
  }

  @PostMapping("/auth/logout")
  public ResponseEntity<Void> logout(HttpServletRequest request) {
    sessions.readToken(request).ifPresent(auth::logout);
    return ResponseEntity.noContent()
        .header(HttpHeaders.SET_COOKIE, sessions.clearedCookie().toString())
        .build();
  }

  @PostMapping("/auth/password-reset")
  public ResponseEntity<Map<String, String>> requestReset(@Valid @RequestBody ResetRequest body,
      HttpServletRequest request) {
    auth.requestPasswordReset(body.email(), ClientInfo.from(request));
    return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of("message",
        "Se houver uma conta com esse endereço, você receberá as orientações de recuperação."));
  }

  @PostMapping("/auth/password-reset/confirm")
  public ResponseEntity<Void> confirmReset(@Valid @RequestBody ResetConfirmation body) {
    auth.resetPassword(body.token(), body.password());
    return ResponseEntity.noContent().build();
  }
}
