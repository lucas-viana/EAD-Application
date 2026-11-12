package br.com.informaticabasica;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.informaticabasica.auth.PasswordResetMailer;
import jakarta.servlet.http.Cookie;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Fluxo completo contra um PostgreSQL real (mesmo motor do Supabase). Requer Docker;
 * sem Docker, a classe é ignorada.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class ApiIntegrationTest {

  @Container
  @ServiceConnection
  static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17-alpine");

  static Path mediaDir;

  @DynamicPropertySource
  static void properties(DynamicPropertyRegistry registry) throws IOException {
    mediaDir = Files.createTempDirectory("ib-media");
    Files.write(mediaDir.resolve("m02-a02.mp4"), new byte[] {0, 0, 0, 24, 'f', 't', 'y', 'p'});
    registry.add("app.media.local-dir", mediaDir::toString);
    registry.add("app.media.signing-secret", () -> "segredo-de-teste-para-assinatura-de-midia");
    registry.add("app.admin-emails", () -> "admin@exemplo.com");
    registry.add("app.session.cookie-secure", () -> "false");
  }

  @AfterAll
  static void cleanup() throws IOException {
    try (var files = Files.walk(mediaDir)) {
      files.sorted((a, b) -> b.compareTo(a)).forEach(p -> p.toFile().delete());
    }
  }

  @Autowired MockMvc mvc;
  @Autowired JdbcClient jdbc;
  @MockitoBean PasswordResetMailer mailer;

  /** Simula o navegador: guarda cookies e envia o token CSRF como a SPA. */
  class Browser {
    final List<Cookie> cookies = new ArrayList<>();

    MvcResult perform(MockHttpServletRequestBuilder request) throws Exception {
      if (!cookies.isEmpty()) {
        request.cookie(cookies.toArray(Cookie[]::new));
      }
      cookies.stream().filter(c -> c.getName().equals("XSRF-TOKEN")).findFirst()
          .ifPresent(c -> request.header("X-XSRF-TOKEN", c.getValue()));
      MvcResult result = mvc.perform(request).andReturn();
      for (Cookie c : result.getResponse().getCookies()) {
        cookies.removeIf(existing -> existing.getName().equals(c.getName()));
        if (c.getMaxAge() != 0 && !c.getValue().isEmpty()) {
          cookies.add(c);
        }
      }
      return result;
    }

    MvcResult json(MockHttpServletRequestBuilder request, String body) throws Exception {
      return perform(request.contentType(MediaType.APPLICATION_JSON).content(body));
    }

    Browser start() throws Exception {
      perform(get("/api/session"));
      return this;
    }
  }

  String email;

  @BeforeEach
  void newEmail() {
    email = "ana+" + UUID.randomUUID().toString().substring(0, 8) + "@exemplo.com";
  }

  String credentials(String mail, String password) {
    return "{\"email\":\"" + mail + "\",\"password\":\"" + password + "\"}";
  }

  @Test
  void anonymousSessionAndProtectedEndpoints() throws Exception {
    mvc.perform(get("/api/session"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.authenticated").value(false));
    mvc.perform(get("/api/videos/m02-a02")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/account")).andExpect(status().isUnauthorized());
  }

  @Test
  void stateChangingRequestsRequireCsrfToken() throws Exception {
    mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(credentials(email, "senha-segura-123")))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error").value("csrf_invalid"));
  }

  @Test
  void registerLoginVideoAccessAndLogout() throws Exception {
    Browser browser = new Browser().start();

    MvcResult registered = browser.json(post("/api/auth/register"), credentials(email, "senha-segura-123"));
    assertThat(registered.getResponse().getStatus()).isEqualTo(201);
    Cookie session = browser.cookies.stream().filter(c -> c.getName().equals("ib_session")).findFirst()
        .orElseThrow();
    assertThat(session.isHttpOnly()).isTrue();

    MvcResult current = browser.perform(get("/api/session"));
    assertThat(current.getResponse().getContentAsString()).contains("\"authenticated\":true", email);

    // Vídeo com arquivo: URL temporária e entrega do arquivo assinado.
    MvcResult video = browser.perform(get("/api/videos/m02-a02"));
    assertThat(video.getResponse().getStatus()).isEqualTo(200);
    String url = com.jayway.jsonpath.JsonPath.read(video.getResponse().getContentAsString(), "$.url");
    assertThat(url).startsWith("/api/media/videos/m02-a02?exp=");
    mvc.perform(get(url)).andExpect(status().isOk())
        .andExpect(header().string("Content-Type", "video/mp4"));
    mvc.perform(get(url.replace("sig=", "sig=x"))).andExpect(status().isForbidden());

    // Vídeo sem arquivo → 503; aula desconhecida → 404.
    assertThat(browser.perform(get("/api/videos/m01-a01")).getResponse().getStatus()).isEqualTo(503);
    assertThat(browser.perform(get("/api/videos/m09-a01")).getResponse().getStatus()).isEqualTo(404);

    // Acesso: 201 na primeira abertura, 200 duplicate na recarga.
    String event = "{\"type\":\"lesson_open\",\"lessonId\":\"m02-a02\"}";
    MvcResult first = browser.json(post("/api/access-events"), event);
    assertThat(first.getResponse().getStatus()).isEqualTo(201);
    MvcResult again = browser.json(post("/api/access-events"), event);
    assertThat(again.getResponse().getStatus()).isEqualTo(200);
    assertThat(again.getResponse().getContentAsString()).contains("\"duplicate\":true");
    assertThat(browser.json(post("/api/access-events"), "{\"type\":\"lesson_open\",\"lessonId\":\"m02-a09\"}")
        .getResponse().getStatus()).isEqualTo(404);

    // Logout invalida a sessão no servidor, mesmo que o cookie antigo seja reenviado.
    assertThat(browser.perform(post("/api/auth/logout")).getResponse().getStatus()).isEqualTo(204);
    mvc.perform(get("/api/videos/m02-a02").cookie(session)).andExpect(status().isUnauthorized());

    // Nova sessão pode contar novamente.
    Browser second = new Browser().start();
    assertThat(second.json(post("/api/auth/login"), credentials(email.toUpperCase(), "senha-segura-123"))
        .getResponse().getStatus()).isEqualTo(200);
    assertThat(second.json(post("/api/access-events"), event).getResponse().getStatus()).isEqualTo(201);
    long count = jdbc.sql("select count(*) from ead.access_events e join ead.app_users u on u.id = e.user_id "
        + "where u.email = :email").param("email", email).query(Long.class).single();
    assertThat(count).isEqualTo(2);
  }

  @Test
  void loginErrorsAndDuplicateRegistration() throws Exception {
    Browser browser = new Browser().start();
    browser.json(post("/api/auth/register"), credentials(email, "senha-segura-123"));

    Browser other = new Browser().start();
    MvcResult wrong = other.json(post("/api/auth/login"), credentials(email, "senha-errada-123"));
    assertThat(wrong.getResponse().getStatus()).isEqualTo(401);
    assertThat(wrong.getResponse().getContentAsString()).contains("invalid_credentials");

    MvcResult duplicate = other.json(post("/api/auth/register"), credentials(email, "outra-senha-123"));
    assertThat(duplicate.getResponse().getStatus()).isEqualTo(409);

    MvcResult weak = other.json(post("/api/auth/register"), credentials("novo-" + email, "curta"));
    assertThat(weak.getResponse().getStatus()).isEqualTo(400);
    assertThat(weak.getResponse().getContentAsString()).contains("weak_password");
  }

  @Test
  void passwordResetFlow() throws Exception {
    Browser browser = new Browser().start();
    browser.json(post("/api/auth/register"), credentials(email, "senha-segura-123"));

    Browser anonymous = new Browser().start();
    assertThat(anonymous.json(post("/api/auth/password-reset"), "{\"email\":\"" + email + "\"}")
        .getResponse().getStatus()).isEqualTo(202);
    // Endereço sem conta recebe a mesma resposta.
    assertThat(anonymous.json(post("/api/auth/password-reset"), "{\"email\":\"ninguem@exemplo.com\"}")
        .getResponse().getStatus()).isEqualTo(202);

    ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
    verify(mailer).send(eq(email), token.capture());

    String confirm = "{\"token\":\"" + token.getValue() + "\",\"password\":\"nova-senha-segura\"}";
    assertThat(anonymous.json(post("/api/auth/password-reset/confirm"), confirm)
        .getResponse().getStatus()).isEqualTo(204);
    // Token de uso único.
    assertThat(anonymous.json(post("/api/auth/password-reset/confirm"), confirm)
        .getResponse().getStatus()).isEqualTo(400);
    // Sessões anteriores foram encerradas; a nova senha funciona.
    assertThat(browser.perform(get("/api/account")).getResponse().getStatus()).isEqualTo(401);
    assertThat(anonymous.json(post("/api/auth/login"), credentials(email, "nova-senha-segura"))
        .getResponse().getStatus()).isEqualTo(200);
  }

  @Test
  void accountManagement() throws Exception {
    Browser browser = new Browser().start();
    browser.json(post("/api/auth/register"), credentials(email, "senha-segura-123"));

    MvcResult updated = browser.json(patch("/api/account"), "{\"fullName\":\"  Ana   Souza \"}");
    assertThat(updated.getResponse().getContentAsString()).contains("\"fullName\":\"Ana Souza\"");

    String newEmail = "novo-" + email;
    MvcResult noPassword = browser.json(patch("/api/account"), "{\"email\":\"" + newEmail + "\"}");
    assertThat(noPassword.getResponse().getStatus()).isEqualTo(400);
    MvcResult emailChanged = browser.json(patch("/api/account"),
        "{\"email\":\"" + newEmail + "\",\"currentPassword\":\"senha-segura-123\"}");
    assertThat(emailChanged.getResponse().getContentAsString()).contains(newEmail);

    Browser phone = new Browser().start();
    phone.json(post("/api/auth/login"), credentials(newEmail, "senha-segura-123"));
    MvcResult changed = browser.json(put("/api/account/password"),
        "{\"currentPassword\":\"senha-segura-123\",\"newPassword\":\"outra-senha-segura\"}");
    assertThat(changed.getResponse().getStatus()).isEqualTo(204);
    // O dispositivo atual continua conectado; o outro é desconectado.
    assertThat(browser.perform(get("/api/account")).getResponse().getStatus()).isEqualTo(200);
    assertThat(phone.perform(get("/api/account")).getResponse().getStatus()).isEqualTo(401);

    assertThat(browser.json(delete("/api/account"), "{\"password\":\"errada\"}")
        .getResponse().getStatus()).isEqualTo(400);
    assertThat(browser.json(delete("/api/account"), "{\"password\":\"outra-senha-segura\"}")
        .getResponse().getStatus()).isEqualTo(204);
    assertThat(browser.perform(get("/api/session")).getResponse().getContentAsString())
        .contains("\"authenticated\":false");
  }

  @Test
  void adminManagesUsers() throws Exception {
    Browser learner = new Browser().start();
    learner.json(post("/api/auth/register"), credentials(email, "senha-segura-123"));
    assertThat(learner.perform(get("/api/admin/users")).getResponse().getStatus()).isEqualTo(403);

    Browser admin = new Browser().start();
    MvcResult adminLogin = admin.json(post("/api/auth/register"),
        credentials("admin@exemplo.com", "senha-de-admin-123"));
    if (adminLogin.getResponse().getStatus() == 409) {
      admin.json(post("/api/auth/login"), credentials("admin@exemplo.com", "senha-de-admin-123"));
    }
    MvcResult list = admin.perform(get("/api/admin/users").param("query", email));
    assertThat(list.getResponse().getStatus()).isEqualTo(200);
    String id = com.jayway.jsonpath.JsonPath.read(list.getResponse().getContentAsString(), "$.items[0].id");

    MvcResult deactivated = admin.json(patch("/api/admin/users/" + id), "{\"active\":false}");
    assertThat(deactivated.getResponse().getContentAsString()).contains("\"active\":false");
    // Desativar encerra as sessões do usuário.
    assertThat(learner.perform(get("/api/account")).getResponse().getStatus()).isEqualTo(401);

    MvcResult summary = admin.perform(get("/api/admin/summary"));
    assertThat(summary.getResponse().getContentAsString()).contains("\"lessons\"", "m06-a03");
  }
}
