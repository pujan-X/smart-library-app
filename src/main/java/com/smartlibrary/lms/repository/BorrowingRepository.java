package com.smartlibrary.lms.repository;
import com.smartlibrary.lms.entity.Borrowing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface BorrowingRepository extends JpaRepository<Borrowing, Long> {
    List<Borrowing> findByUserId(Long userId);
    long countByStatus(String status);
    List<Borrowing> findByStatus(Borrowing.BorrowingStatus status);
}