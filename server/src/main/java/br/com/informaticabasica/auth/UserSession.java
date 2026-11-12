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

/** Sessão autenticada mantida no servidor. O cookie guarda o token; aqui fica apenas o hash. */
@Entity
@Table(name = "user_sessions")
public class UserSession {

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

  @Column(name = "last_seen_at", nullable = false)
  private Instant lastSeenAt;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "revoked_at")
  private Instant revokedAt;

  @Column(name = "user_agent", length = 255)
  private String userAgent;

  @Column(name = "ip_address", length = 64)
  private String ipAddress;

  protected UserSession() {}

  public UserSession(AppUser user, String tokenHash, Instant now, Instant expiresAt,
      String userAgent, String ipAddress) {
    this.user = user;
    this.tokenHash = tokenHash;
    this.createdAt = now;
    this.lastSeenAt = now;
    this.expiresAt = expiresAt;
    this.userAgent = userAgent;
    this.ipAddress = ipAddress;
  }

  public boolean isValidAt(Instant now) {
    return revokedAt == null && expiresAt.isAfter(now);
  }

  public UUID getId() {
    return id;
  }

  public AppUser getUser() {
    return user;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getLastSeenAt() {
    return lastSeenAt;
  }

  public void setLastSeenAt(Instant lastSeenAt) {
    this.lastSeenAt = lastSeenAt;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public Instant getRevokedAt() {
    return revokedAt;
  }

  public void revoke(Instant when) {
    if (revokedAt == null) {
      revokedAt = when;
    }
  }

  public String getUserAgent() {
    return userAgent;
  }

  public String getIpAddress() {
    return ipAddress;
  }
}
