package br.com.informaticabasica.media;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/** Assinatura HMAC-SHA256 de URLs temporárias de mídia. */
public final class UrlSigner {

  private final SecretKeySpec key;

  public UrlSigner(byte[] secret) {
    if (secret.length < 32) {
      throw new IllegalArgumentException("A chave de assinatura precisa de pelo menos 32 bytes.");
    }
    this.key = new SecretKeySpec(secret, "HmacSHA256");
  }

  public String sign(String lessonId, long expiresAtEpochSeconds) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(key);
      byte[] raw = mac.doFinal((lessonId + ":" + expiresAtEpochSeconds).getBytes(StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    } catch (GeneralSecurityException e) {
      throw new IllegalStateException(e);
    }
  }

  public boolean verify(String lessonId, long expiresAtEpochSeconds, String signature) {
    if (signature == null) {
      return false;
    }
    byte[] expected = sign(lessonId, expiresAtEpochSeconds).getBytes(StandardCharsets.US_ASCII);
    return MessageDigest.isEqual(expected, signature.getBytes(StandardCharsets.US_ASCII));
  }
}
