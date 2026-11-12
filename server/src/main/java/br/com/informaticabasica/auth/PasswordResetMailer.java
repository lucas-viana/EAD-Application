package br.com.informaticabasica.auth;

import br.com.informaticabasica.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Envia as orientações de recuperação. Sem SMTP configurado (desenvolvimento), o link é escrito no log.
 */
@Component
public class PasswordResetMailer {

  private static final Logger log = LoggerFactory.getLogger(PasswordResetMailer.class);

  private final ObjectProvider<JavaMailSender> mailSender;
  private final AppProperties properties;

  public PasswordResetMailer(ObjectProvider<JavaMailSender> mailSender, AppProperties properties) {
    this.mailSender = mailSender;
    this.properties = properties;
  }

  public void send(String email, String token) {
    String link = properties.publicBaseUrl().replaceAll("/+$", "") + "/redefinir-senha?token=" + token;
    JavaMailSender sender = mailSender.getIfAvailable();
    if (sender == null) {
      log.warn("SMTP não configurado. Link de recuperação para {}: {}", email, link);
      return;
    }
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(properties.mail().from());
    message.setTo(email);
    message.setSubject("Recupere seu acesso • Informática Básica");
    message.setText("""
        Olá!

        Recebemos um pedido para criar uma nova senha de acesso aos vídeos do curso Informática Básica.
        Para continuar, abra o endereço abaixo. Ele vale por 1 hora e pode ser usado uma única vez:

        %s

        Se você não fez este pedido, ignore esta mensagem. Sua senha atual continua valendo.

        Informática Básica • Aprenda um passo de cada vez, no seu ritmo.
        """.formatted(link));
    // Envio fora da requisição: a resposta é sempre genérica e não deve revelar, pelo tempo,
    // se o e-mail existe.
    Thread.startVirtualThread(() -> {
      try {
        sender.send(message);
      } catch (MailException e) {
        log.error("Falha ao enviar e-mail de recuperação", e);
      }
    });
  }
}
