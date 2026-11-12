package br.com.informaticabasica.admin;

import br.com.informaticabasica.auth.AuthenticatedUser;
import br.com.informaticabasica.auth.Role;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Administração de usuários. Acesso restrito ao perfil ADMIN (ver SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

  private final AdminService admin;

  public AdminController(AdminService admin) {
    this.admin = admin;
  }

  public record UserUpdate(
      @Size(max = 120, message = "Use um nome com até 120 caracteres.") String fullName,
      Role role,
      Boolean active) {}

  @GetMapping("/users")
  public AdminService.UserPage users(@RequestParam(defaultValue = "") String query,
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
    return admin.list(query, page, size);
  }

  @PatchMapping("/users/{id}")
  public AdminService.AdminUserView update(@AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id, @Valid @RequestBody UserUpdate body) {
    return admin.update(user, id, body.fullName(), body.role(), body.active());
  }

  @DeleteMapping("/users/{id}")
  public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id) {
    admin.delete(user, id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/summary")
  public AdminService.Summary summary() {
    return admin.summary();
  }
}
