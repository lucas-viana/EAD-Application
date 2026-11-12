package br.com.informaticabasica.auth;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

  @Query("select s from UserSession s join fetch s.user where s.tokenHash = :hash")
  Optional<UserSession> findByTokenHash(@Param("hash") String tokenHash);

  @Query("""
      select s from UserSession s
      where s.user.id = :userId and s.revokedAt is null and s.expiresAt > :now
      order by s.lastSeenAt desc
      """)
  List<UserSession> findActiveByUser(@Param("userId") UUID userId, @Param("now") Instant now);

  @Modifying
  @Query("update UserSession s set s.revokedAt = :now where s.user.id = :userId and s.revokedAt is null")
  int revokeAllForUser(@Param("userId") UUID userId, @Param("now") Instant now);

  @Modifying
  @Query("""
      update UserSession s set s.revokedAt = :now
      where s.user.id = :userId and s.revokedAt is null and s.id <> :keepId
      """)
  int revokeOthersForUser(@Param("userId") UUID userId, @Param("keepId") UUID keepId,
      @Param("now") Instant now);

  @Modifying
  @Query("delete from UserSession s where s.expiresAt < :cutoff or s.revokedAt < :cutoff")
  int deleteFinishedBefore(@Param("cutoff") Instant cutoff);
}
