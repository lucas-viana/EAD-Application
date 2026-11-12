package br.com.informaticabasica.analytics;

import br.com.informaticabasica.auth.AuthenticatedUser;
import br.com.informaticabasica.catalog.LessonIds;
import br.com.informaticabasica.catalog.LessonRepository;
import br.com.informaticabasica.common.ApiException;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Registro de acessos identificados às aulas (E6).
 * Uma ocorrência por sessão autenticada + aula: recarga e outra aba não duplicam; nova sessão conta novamente.
 * Não representa reprodução, progresso ou aprendizagem.
 */
@Service
public class AccessEventService {

  public static final String LESSON_OPEN = "lesson_open";

  private final JdbcClient jdbc;
  private final LessonRepository lessons;

  public AccessEventService(JdbcClient jdbc, LessonRepository lessons) {
    this.jdbc = jdbc;
    this.lessons = lessons;
  }

  public record RecordResult(boolean recorded, boolean duplicate) {}

  public record LessonAccessCount(String lessonId, String moduleId, String title, long accesses) {}

  @Transactional
  public RecordResult record(AuthenticatedUser user, String type, String lessonId) {
    if (!LESSON_OPEN.equals(type)) {
      throw ApiException.field("type", "invalid_event_type", "Tipo de evento não reconhecido.");
    }
    if (!LessonIds.isWellFormed(lessonId) || !lessons.existsById(lessonId)) {
      throw ApiException.notFound("lesson_not_found", "Aula não encontrada.");
    }
    int inserted = jdbc.sql("""
            insert into ead.access_events (event_type, session_id, user_id, lesson_id)
            values (:type, :sessionId, :userId, :lessonId)
            on conflict (event_type, session_id, lesson_id) do nothing
            """)
        .param("type", type)
        .param("sessionId", user.sessionId())
        .param("userId", user.userId())
        .param("lessonId", lessonId)
        .update();
    return inserted == 1 ? new RecordResult(true, false) : new RecordResult(false, true);
  }

  /** Indicador agregado para a administração: acessos identificados por aula. */
  @Transactional(readOnly = true)
  public List<LessonAccessCount> countsByLesson() {
    return jdbc.sql("""
            select l.id, l.module_id, l.title, count(e.id) as accesses
            from ead.lessons l
            left join ead.access_events e on e.lesson_id = l.id and e.event_type = 'lesson_open'
            group by l.id, l.module_id, l.title, l.position
            order by l.module_id, l.position
            """)
        .query((rs, i) -> new LessonAccessCount(rs.getString(1), rs.getString(2),
            rs.getString(3), rs.getLong(4)))
        .list();
  }
}
