package br.com.informaticabasica.admin;

import br.com.informaticabasica.analytics.AccessEventService;
import br.com.informaticabasica.auth.AppUser;
import br.com.informaticabasica.auth.AppUserRepository;
import br.com.informaticabasica.auth.AuthenticatedUser;
import br.com.informaticabasica.auth.Role;
import br.com.informaticabasica.auth.SessionService;
import br.com.informaticabasica.common.ApiException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Administração de contas: consulta, perfil, ativação e exclusão.
 * Não há funções pedagógicas (notas, progresso ou painel docente).
 */
@Service
public class AdminService {

  private final AppUserRepository users;
  private final SessionService sessions;
  private final AccessEventService accessEvents;

  public AdminService(AppUserRepository users, SessionService sessions,
      AccessEventService accessEvents) {
    this.users = users;
    this.sessions = sessions;
    this.accessEvents = accessEvents;
  }

  public record AdminUserView(UUID id, String email, String fullName, Role role, boolean active,
      Instant createdAt, Instant lastLoginAt) {
    static AdminUserView of(AppUser u) {
      return new AdminUserView(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.isActive(),
          u.getCreatedAt(), u.getLastLoginAt());
    }
  }

  public record UserPage(List<AdminUserView> items, int page, int size, long totalItems,
      int totalPages) {}

  public record Summary(long totalUsers, long activeUsers, long admins, long totalAccesses,
      List<AccessEventService.LessonAccessCount> lessons) {}

  @Transactional(readOnly = true)
  public UserPage list(String query, int page, int size) {
    int safeSize = Math.min(Math.max(size, 1), 100);
    int safePage = Math.max(page, 0);
    String q = query == null ? "" : query.trim();
    Page<AppUser> result = users.search(q,
        PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
    return new UserPage(result.map(AdminUserView::of).getContent(), safePage, safeSize,
        result.getTotalElements(), result.getTotalPages());
  }

  @Transactional
  public AdminUserView update(AuthenticatedUser admin, UUID userId, String fullName, Role role,
      Boolean active) {
    AppUser user = find(userId);
    boolean self = user.getId().equals(admin.userId());
    if (fullName != null) {
      String trimmed = fullName.trim().replaceAll("\\s+", " ");
      user.setFullName(trimmed.isEmpty() ? null : trimmed);
    }
    if (role != null && role != user.getRole()) {
      if (self) {
        throw ApiException.badRequest("self_change",
            "Você não pode alterar o próprio perfil de acesso.");
      }
      if (user.getRole() == Role.ADMIN) {
        ensureAnotherAdmin();
      }
      user.setRole(role);
    }
    if (active != null && active != user.isActive()) {
      if (self) {
        throw ApiException.badRequest("self_change", "Você não pode desativar a própria conta.");
      }
      if (!active && user.getRole() == Role.ADMIN) {
        ensureAnotherAdmin();
      }
      user.setActive(active);
      if (!active) {
        sessions.revokeAll(user.getId());
      }
    }
    return AdminUserView.of(users.saveAndFlush(user));
  }

  @Transactional
  public void delete(AuthenticatedUser admin, UUID userId) {
    AppUser user = find(userId);
    if (user.getId().equals(admin.userId())) {
      throw ApiException.badRequest("self_change",
          "Para excluir a própria conta, use a página Minha conta.");
    }
    if (user.getRole() == Role.ADMIN) {
      ensureAnotherAdmin();
    }
    users.delete(user);
  }

  @Transactional(readOnly = true)
  public Summary summary() {
    List<AccessEventService.LessonAccessCount> lessons = accessEvents.countsByLesson();
    long total = lessons.stream().mapToLong(AccessEventService.LessonAccessCount::accesses).sum();
    return new Summary(users.count(), users.countByActiveTrue(), users.countByRole(Role.ADMIN),
        total, lessons);
  }

  private AppUser find(UUID id) {
    return users.findById(id)
        .orElseThrow(() -> ApiException.notFound("user_not_found", "Usuário não encontrado."));
  }

  private void ensureAnotherAdmin() {
    if (users.countByRole(Role.ADMIN) <= 1) {
      throw ApiException.badRequest("last_admin",
          "É necessário manter pelo menos uma conta de administração.");
    }
  }
}
