package com.smartlibrary.lms.service.impl;
import com.smartlibrary.lms.entity.Book;
import com.smartlibrary.lms.entity.Borrowing;
import com.smartlibrary.lms.entity.User;
import com.smartlibrary.lms.repository.BookRepository;
import com.smartlibrary.lms.repository.BorrowingRepository;
import com.smartlibrary.lms.repository.UserRepository;
import com.smartlibrary.lms.service.BorrowingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
@Service
public class BorrowingServiceImpl implements BorrowingService {
    private final BorrowingRepository borrowingRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    public BorrowingServiceImpl(BorrowingRepository borrowingRepository, BookRepository bookRepository, UserRepository userRepository) {
        this.borrowingRepository = borrowingRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }
    @Override
    @Transactional 
    public Borrowing issueBook(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));
        if (book.getAvailableCopies() <= 0) {
            throw new RuntimeException("Book is currently out of stock!");
        }
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);
        Borrowing borrowing = new Borrowing();
        borrowing.setUser(user);
        borrowing.setBook(book);
        borrowing.setIssueDate(LocalDate.now());
        borrowing.setDueDate(LocalDate.now().plusDays(14)); 
        borrowing.setStatus(Borrowing.BorrowingStatus.ISSUED);
        return borrowingRepository.save(borrowing);
    }
    @Override
    @Transactional
    public Borrowing returnBook(Long borrowingId) {
        Borrowing borrowing = borrowingRepository.findById(borrowingId)
                .orElseThrow(() -> new RuntimeException("Borrowing record not found"));
        if (borrowing.getStatus() == Borrowing.BorrowingStatus.RETURNED) {
            throw new RuntimeException("Book is already returned!");
        }
        borrowing.setStatus(Borrowing.BorrowingStatus.RETURNED);
        borrowing.setReturnDate(LocalDate.now());
        Book book = borrowing.getBook();
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);
        return borrowingRepository.save(borrowing);
    }
}
