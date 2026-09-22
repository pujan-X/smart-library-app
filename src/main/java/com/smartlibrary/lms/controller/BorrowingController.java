package com.smartlibrary.lms.controller;
import com.smartlibrary.lms.entity.Book;
import com.smartlibrary.lms.entity.Borrowing;
import com.smartlibrary.lms.entity.User;
import com.smartlibrary.lms.repository.BookRepository;
import com.smartlibrary.lms.repository.BorrowingRepository;
import com.smartlibrary.lms.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
@RestController
@RequestMapping("/api/borrowings")
@CrossOrigin(origins = "*")
public class BorrowingController {
    private final BorrowingRepository borrowingRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    public BorrowingController(BorrowingRepository borrowingRepository, BookRepository bookRepository, UserRepository userRepository) {
        this.borrowingRepository = borrowingRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }
    @PostMapping("/borrow/{bookId}")
    public ResponseEntity<?> borrowBook(@PathVariable Long bookId, Authentication authentication) {
        String username = authentication.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("User not found.");
        User user = userOpt.get();
        Optional<Book> bookOpt = bookRepository.findById(bookId);
        if (bookOpt.isEmpty()) return ResponseEntity.status(404).body("Book not found.");
        Book book = bookOpt.get();
        if (book.getAvailableCopies() <= 0) {
            return ResponseEntity.badRequest().body("This book is currently out of stock.");
        }
        boolean alreadyBorrowed = borrowingRepository.findAll().stream()
                .anyMatch(b -> b.getUser().getId().equals(user.getId()) 
                            && b.getBook().getId().equals(book.getId()) 
                            && b.getStatus().toString().equals("ISSUED")); 
        if (alreadyBorrowed) {
            return ResponseEntity.badRequest().body("You have already borrowed this book.");
        }
        Borrowing loan = new Borrowing();
        loan.setUser(user);
        loan.setBook(book);
        loan.setStatus(Borrowing.BorrowingStatus.ISSUED);
        loan.setIssueDate(LocalDate.now());
        loan.setDueDate(LocalDate.now().plusDays(14)); 
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);
        borrowingRepository.save(loan);
        return ResponseEntity.ok("Book borrowed successfully! Due in 14 days.");
    }
    @PostMapping("/admin/issue/isbn/{isbn}/to/{username}")
    public ResponseEntity<?> adminIssueBookByIsbn(@PathVariable String isbn, @PathVariable String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body("Student/User not found.");
        User user = userOpt.get();
        Optional<Book> bookOpt = bookRepository.findAll().stream()
                .filter(b -> b.getIsbn() != null && b.getIsbn().equals(isbn))
                .findFirst();
        if (bookOpt.isEmpty()) return ResponseEntity.status(404).body("No book found with that ISBN.");
        Book book = bookOpt.get();
        if (book.getAvailableCopies() <= 0) {
            return ResponseEntity.badRequest().body("Book is out of stock.");
        }
        boolean alreadyBorrowed = borrowingRepository.findAll().stream()
                .anyMatch(b -> b.getUser().getId().equals(user.getId()) 
                            && b.getBook().getId().equals(book.getId()) 
                            && b.getStatus().toString().equals("ISSUED"));
        if (alreadyBorrowed) return ResponseEntity.badRequest().body("User already has this book issued.");
        Borrowing loan = new Borrowing();
        loan.setUser(user);
        loan.setBook(book);
        loan.setStatus(Borrowing.BorrowingStatus.ISSUED);
        loan.setIssueDate(java.time.LocalDate.now());
        loan.setDueDate(java.time.LocalDate.now().plusDays(14)); 
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);
        borrowingRepository.save(loan);
        return ResponseEntity.ok("Issued successfully to " + user.getUsername() + "!");
    }
    @PostMapping("/return/isbn/{isbn}")
    public ResponseEntity<?> returnBookByIsbn(@PathVariable String isbn) {
        Optional<Borrowing> optLoan = borrowingRepository.findAll().stream()
                .filter(b -> b.getBook() != null 
                          && b.getBook().getIsbn() != null 
                          && b.getBook().getIsbn().equals(isbn) 
                          && b.getStatus().toString().equals("ISSUED"))
                .findFirst();
        if (optLoan.isEmpty()) {
            return ResponseEntity.badRequest().body("This ISBN is not currently issued to anyone.");
        }
        Borrowing loan = optLoan.get();
        loan.setStatus(Borrowing.BorrowingStatus.RETURNED);
        loan.setReturnDate(java.time.LocalDate.now());
        borrowingRepository.save(loan);
        Book book = loan.getBook();
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);
        return ResponseEntity.ok("Book returned successfully! Stock updated.");
    }
   @GetMapping("/my")
    public ResponseEntity<?> getMyLoans(java.security.Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        Optional<User> userOpt = userRepository.findByUsername(principal.getName());
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body("User not found");
        User currentUser = userOpt.get();
        List<Map<String, Object>> safeLoans = new java.util.ArrayList<>();
        for (Borrowing b : borrowingRepository.findAll()) {
            try {
                if (b.getUser() != null && b.getUser().getId().equals(currentUser.getId())) {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", b.getId());
                    if (b.getBook() != null) {
                        map.put("bookTitle", b.getBook().getTitle());
                        map.put("bookAuthor", b.getBook().getAuthor());
                    } else {
                        map.put("bookTitle", "Unknown Title");
                        map.put("bookAuthor", "Unknown Author");
                    }
                    map.put("issueDate", b.getIssueDate() != null ? b.getIssueDate().toString() : "Pending");
                    map.put("dueDate", b.getDueDate() != null ? b.getDueDate().toString() : "Pending");
                    String status = "ACTIVE";
                    long daysOverdue = 0;
                    if (b.getStatus() != null) {
                        String dbStatus = b.getStatus().toString();
                        if (dbStatus.equals("ISSUED")) {
                            if (b.getDueDate() != null && java.time.LocalDate.now().isAfter(b.getDueDate())) {
                                status = "OVERDUE";
                                daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(b.getDueDate(), java.time.LocalDate.now());
                            } else {
                                status = "ACTIVE";
                            }
                        } else if (dbStatus.equals("RETURNED")) {
                            status = "RETURNED";
                        }
                    }
                    map.put("status", status);
                    map.put("daysOverdue", daysOverdue);
                    map.put("fineAmount", daysOverdue * 12); 
                    safeLoans.add(map);
                }
            } catch (Exception e) {
                System.out.println("Skipped corrupted loan record: " + e.getMessage());
            }
        }
        return ResponseEntity.ok(safeLoans);
    }
}