package br.com.informaticabasica.auth;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

  @Query("select u from AppUser u where lower(u.email) = lower(:email)")
  Optional<AppUser> findByEmailIgnoreCase(@Param("email") String email);

  @Query("select count(u) > 0 from AppUser u where lower(u.email) = lower(:email)")
  boolean existsByEmailIgnoreCase(@Param("email") String email);

  @Query("""
      select u from AppUser u
      where :query = ''
         or lower(u.email) like lower(concat('%', :query, '%'))
         or lower(coalesce(u.fullName, '')) like lower(concat('%', :query, '%'))
      """)
  Page<AppUser> search(@Param("query") String query, Pageable pageable);

  long countByRole(Role role);

  long countByActiveTrue();
}
