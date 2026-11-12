package br.com.informaticabasica.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Registro de uma aula no servidor: ID público (m01-a01…m06-a03) e caminho privado do vídeo.
 * O conteúdo público (texto, exemplos, transcrições) fica nos arquivos do front-end.
 */
@Entity
@Table(name = "lessons")
public class Lesson {

  @Id
  @Column(length = 7)
  private String id;

  @Column(name = "module_id", nullable = false, length = 3)
  private String moduleId;

  @Column(nullable = false)
  private int position;

  @Column(nullable = false, length = 160)
  private String title;

  @Column(name = "video_object_path", length = 255)
  private String videoObjectPath;

  protected Lesson() {}

  public String getId() {
    return id;
  }

  public String getModuleId() {
    return moduleId;
  }

  public int getPosition() {
    return position;
  }

  public String getTitle() {
    return title;
  }

  public String getVideoObjectPath() {
    return videoObjectPath;
  }
}
