package br.com.informaticabasica.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;

  @Column(name = "token_hash", nullable = false, length = 64)
  private String tokenHash;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "used_at")
  private Instant usedAt;

  protected PasswordResetToken() {}

  public PasswordResetToken(AppUser user, String tokenHash, Instant now, Instant expiresAt) {
    this.user = user;
    this.tokenHash = tokenHash;
    this.createdAt = now;
    this.expiresAt = expiresAt;
  }

  public boolean isUsableAt(Instant now) {
    return usedAt == null && expiresAt.isAfter(now);
  }

  public AppUser getUser() {
    return user;
  }

  public void markUsed(Instant when) {
    usedAt = when;
  }
}
