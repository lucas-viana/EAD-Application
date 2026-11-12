package br.com.informaticabasica.common;

import java.util.Map;

/** Corpo padrão de erro: {@code { error, message, fields? }}. */
public record ApiError(String error, String message, Map<String, String> fields) {

  public static ApiError of(String error, String message) {
    return new ApiError(error, message, null);
  }
}
