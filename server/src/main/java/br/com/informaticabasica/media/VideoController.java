package br.com.informaticabasica.media;

import br.com.informaticabasica.catalog.Lesson;
import br.com.informaticabasica.catalog.LessonIds;
import br.com.informaticabasica.catalog.LessonRepository;
import br.com.informaticabasica.common.ApiError;
import br.com.informaticabasica.common.ApiException;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Optional;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Contrato E3: GET /api/videos/:lessonId → 200 { url, expiresAt }; 401 sem sessão;
 * 404 aula desconhecida; 503 indisponível.
 */
@RestController
public class VideoController {

  private final LessonRepository lessons;
  private final VideoUrlProvider provider;
  private final ObjectProvider<LocalVideoStorage> localStorage;

  public VideoController(LessonRepository lessons, VideoUrlProvider provider,
      ObjectProvider<LocalVideoStorage> localStorage) {
    this.lessons = lessons;
    this.provider = provider;
    this.localStorage = localStorage;
  }

  @GetMapping("/api/videos/{lessonId}")
  public ResponseEntity<VideoUrlProvider.VideoLink> video(@PathVariable String lessonId) {
    Lesson lesson = findLesson(lessonId);
    VideoUrlProvider.VideoLink link = provider.linkFor(lesson);
    return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(link);
  }

  /** Entrega do arquivo local por URL assinada (somente com VIDEO_PROVIDER=local). */
  @GetMapping("/api/media/videos/{lessonId}")
  public ResponseEntity<Resource> media(@PathVariable String lessonId,
      @RequestParam("exp") long exp, @RequestParam("sig") String sig) {
    LocalVideoStorage storage = localStorage.getIfAvailable();
    if (storage == null || !LessonIds.isWellFormed(lessonId)) {
      throw ApiException.notFound("not_found", "Vídeo não encontrado.");
    }
    Lesson lesson = lessons.findById(lessonId)
        .orElseThrow(() -> ApiException.notFound("not_found", "Vídeo não encontrado."));
    Optional<Path> file = storage.verifiedFile(lesson, exp, sig);
    if (file.isEmpty()) {
      throw new ApiException(HttpStatus.FORBIDDEN, "link_expired",
          "O endereço do vídeo expirou. Abra a aula novamente.");
    }
    Resource resource = new FileSystemResource(file.get());
    MediaType type = MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM);
    return ResponseEntity.ok()
        .contentType(type)
        .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePrivate())
        .body(resource);
  }

  @ExceptionHandler(VideoUrlProvider.VideoUnavailableException.class)
  ResponseEntity<ApiError> unavailable() {
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
        .cacheControl(CacheControl.noStore())
        .body(ApiError.of("video_unavailable",
            "O vídeo não carregou. Você pode tentar novamente ou continuar pelo texto da aula."));
  }

  private Lesson findLesson(String lessonId) {
    if (!LessonIds.isWellFormed(lessonId)) {
      throw ApiException.notFound("lesson_not_found", "Aula não encontrada.");
    }
    return lessons.findById(lessonId)
        .orElseThrow(() -> ApiException.notFound("lesson_not_found", "Aula não encontrada."));
  }
}
