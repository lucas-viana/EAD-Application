package br.com.informaticabasica.common;

import jakarta.servlet.http.HttpServletRequest;

/** Dados do cliente usados para identificar sessões e limitar tentativas. */
public record ClientInfo(String ipAddress, String userAgent) {

  public static ClientInfo from(HttpServletRequest request) {
    // Com server.forward-headers-strategy=native, getRemoteAddr já considera o proxy (nginx).
    String ip = request.getRemoteAddr();
    String agent = request.getHeader("User-Agent");
    return new ClientInfo(truncate(ip, 64), truncate(agent, 255));
  }

  private static String truncate(String value, int max) {
    if (value == null) {
      return null;
    }
    return value.length() <= max ? value : value.substring(0, max);
  }
}
