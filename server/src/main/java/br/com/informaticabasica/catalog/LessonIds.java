package br.com.informaticabasica.catalog;

import java.util.regex.Pattern;

/** Formato dos IDs publicados pela E2: m01…m06 e m01-a01…m06-a03. */
public final class LessonIds {

  private static final Pattern LESSON_ID = Pattern.compile("^m0[1-6]-a0[1-3]$");

  private LessonIds() {}

  public static boolean isWellFormed(String lessonId) {
    return lessonId != null && LESSON_ID.matcher(lessonId).matches();
  }
}
