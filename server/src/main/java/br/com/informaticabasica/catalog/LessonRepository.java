package br.com.informaticabasica.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LessonRepository extends JpaRepository<Lesson, String> {

  List<Lesson> findAllByOrderByModuleIdAscPositionAsc();
}
