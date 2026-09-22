package com.smartlibrary.lms.repository;
import com.smartlibrary.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @org.springframework.data.jpa.repository.Query(value = "SELECT COUNT(u.id) FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name != 'ROLE_ADMIN'", nativeQuery = true)
    long countStandardUsers();    
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Boolean existsByUsername(String username);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "INSERT INTO user_roles (user_id, role_id) SELECT :userId, id FROM roles WHERE name = :roleName", nativeQuery = true)
    void assignRoleToUser(@org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("roleName") String roleName);
    @org.springframework.data.jpa.repository.Query(value = "SELECT u.id, u.full_name as fullName, u.username, count(b.id) as openLoansCount, u.last_login as lastLogin " +
            "FROM users u JOIN borrowing b ON u.id = b.user_id " +
            "WHERE b.status = 'BORROWED' " +
            "GROUP BY u.id, u.full_name, u.username, u.last_login " +
            "ORDER BY openLoansCount DESC LIMIT :limit", nativeQuery = true)
    List<com.smartlibrary.lms.repository.UserActivityProjection> findActiveBorrowers(@org.springframework.data.repository.query.Param("limit") int limit);
}