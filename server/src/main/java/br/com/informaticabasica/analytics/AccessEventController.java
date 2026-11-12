package br.com.informaticabasica.analytics;

import br.com.informaticabasica.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Contrato E6: POST /api/access-events { type: "lesson_open", lessonId }
 * → 201 na primeira ocorrência; 200 { duplicate: true } na repetição.
 */
@RestController
public class AccessEventController {

  private final AccessEventService service;

  public AccessEventController(AccessEventService service) {
    this.service = service;
  }

  public record AccessEventRequest(
      @NotBlank(message = "Informe o tipo do evento.") String type,
      @NotBlank(message = "Informe a aula.") String lessonId) {}

  @PostMapping("/api/access-events")
  public ResponseEntity<AccessEventService.RecordResult> record(
      @AuthenticationPrincipal AuthenticatedUser user, @Valid @RequestBody AccessEventRequest body) {
    AccessEventService.RecordResult result = service.record(user, body.type(), body.lessonId());
    return ResponseEntity.status(result.recorded() ? HttpStatus.CREATED : HttpStatus.OK).body(result);
  }
}
