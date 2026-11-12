package br.com.informaticabasica.admin;

import br.com.informaticabasica.auth.AppUserRepository;
import br.com.informaticabasica.auth.Role;
import br.com.informaticabasica.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Concede o perfil ADMIN às contas listadas em ADMIN_EMAILS. Quem ainda não tem conta
 * recebe o perfil ao se cadastrar com um desses e-mails.
 */
@Component
public class AdminBootstrap {

  private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

  private final AppUserRepository users;
  private final AppProperties properties;

  public AdminBootstrap(AppUserRepository users, AppProperties properties) {
    this.users = users;
    this.properties = properties;
  }

  @EventListener(ApplicationReadyEvent.class)
  @Transactional
  public void promoteConfiguredAdmins() {
    for (String email : properties.adminEmailList()) {
      users.findByEmailIgnoreCase(email)
          .filter(u -> u.getRole() != Role.ADMIN)
          .ifPresent(u -> {
            u.setRole(Role.ADMIN);
            log.info("Perfil ADMIN concedido a {}", email);
          });
    }
  }
}
