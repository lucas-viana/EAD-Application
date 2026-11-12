package br.com.informaticabasica.config;

import br.com.informaticabasica.auth.SessionService;
import br.com.informaticabasica.common.ApiError;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.function.Supplier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
public class SecurityConfig {

  @Bean
  Clock clock() {
    return Clock.systemUTC();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    // Padrão: BCrypt, com prefixo {bcrypt} para permitir migração futura de algoritmo.
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
  }

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http, SessionService sessions) throws Exception {
    http
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .httpBasic(b -> b.disable())
        .formLogin(f -> f.disable())
        .logout(l -> l.disable())
        .requestCache(c -> c.disable())
        .csrf(csrf -> csrf
            .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
        .addFilterBefore(new SessionAuthenticationFilter(sessions), AnonymousAuthenticationFilter.class)
        .addFilterAfter(new CsrfCookieFilter(), AnonymousAuthenticationFilter.class)
        .headers(h -> h
            .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.SAME_ORIGIN))
            .contentSecurityPolicy(c -> c.policyDirectives("default-src 'none'; frame-ancestors 'none'")))
        .exceptionHandling(e -> e
            .authenticationEntryPoint(jsonEntryPoint())
            .accessDeniedHandler(jsonAccessDenied()))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health/**", "/actuator/health").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/session").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/media/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/**").authenticated()
            .anyRequest().denyAll());
    return http.build();
  }

  private static AuthenticationEntryPoint jsonEntryPoint() {
    return (request, response, ex) -> writeJson(response, HttpServletResponse.SC_UNAUTHORIZED,
        ApiError.of("unauthenticated", "Entre para continuar."));
  }

  private static AccessDeniedHandler jsonAccessDenied() {
    return (request, response, ex) -> {
      if (ex instanceof CsrfException) {
        writeJson(response, HttpServletResponse.SC_FORBIDDEN,
            ApiError.of("csrf_invalid", "A página ficou aberta por muito tempo. Tente novamente."));
      } else {
        writeJson(response, HttpServletResponse.SC_FORBIDDEN,
            ApiError.of("forbidden", "Você não tem permissão para esta ação."));
      }
    };
  }

  private static void writeJson(HttpServletResponse response, int status, ApiError error)
      throws IOException {
    response.setStatus(status);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.getWriter().write("{\"error\":\"" + error.error() + "\",\"message\":\""
        + error.message().replace("\"", "\\\"") + "\"}");
  }

  /**
   * Padrão recomendado pelo Spring Security para SPAs: o token vem do cookie XSRF-TOKEN
   * e volta no cabeçalho X-XSRF-TOKEN.
   */
  static final class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

    private final CsrfTokenRequestHandler plain = new CsrfTokenRequestAttributeHandler();
    private final CsrfTokenRequestHandler xor = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
        Supplier<CsrfToken> csrfToken) {
      xor.handle(request, response, csrfToken);
      csrfToken.get();
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
      String header = request.getHeader(csrfToken.getHeaderName());
      return StringUtils.hasText(header)
          ? plain.resolveCsrfTokenValue(request, csrfToken)
          : xor.resolveCsrfTokenValue(request, csrfToken);
    }
  }

  /** Garante que o cookie XSRF-TOKEN seja emitido já na primeira requisição. */
  static final class CsrfCookieFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
        FilterChain chain) throws ServletException, IOException {
      CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
      if (token != null) {
        token.getToken();
      }
      chain.doFilter(request, response);
    }
  }
}
