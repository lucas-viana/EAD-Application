package br.com.informaticabasica.config;

import br.com.informaticabasica.auth.AuthenticatedUser;
import br.com.informaticabasica.auth.SessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/** Lê o cookie de sessão, valida no banco e define a identidade da requisição. */
public class SessionAuthenticationFilter extends OncePerRequestFilter {

  private final SessionService sessions;

  public SessionAuthenticationFilter(SessionService sessions) {
    this.sessions = sessions;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    return !request.getRequestURI().startsWith("/api/");
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain chain) throws ServletException, IOException {
    sessions.readToken(request)
        .flatMap(sessions::resolve)
        .ifPresent(this::authenticate);
    chain.doFilter(request, response);
  }

  private void authenticate(AuthenticatedUser user) {
    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.role().name()));
    var authentication = UsernamePasswordAuthenticationToken.authenticated(user, null, authorities);
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authentication);
    SecurityContextHolder.setContext(context);
  }
}
