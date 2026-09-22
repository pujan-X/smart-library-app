package com.smartlibrary.lms.controller;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.smartlibrary.lms.repository.BookRepository;
import com.smartlibrary.lms.repository.BorrowingRepository;
import com.smartlibrary.lms.repository.UserRepository;
import com.smartlibrary.lms.repository.CategoryRepository;
import java.util.HashMap;
import java.util.Map;
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BorrowingRepository borrowingRepository;
    private final CategoryRepository categoryRepository;
    public UserController(UserRepository userRepository, BookRepository bookRepository,
            BorrowingRepository borrowingRepository, CategoryRepository categoryRepository) {
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.borrowingRepository = borrowingRepository;
        this.categoryRepository = categoryRepository;
    }
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("username", authentication.getName());
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                .orElse("STUDENT"); 
        userData.put("role", role);
        return ResponseEntity.ok(userData);
    }
    @GetMapping("/dashboard/stats")
    public ResponseEntity<com.smartlibrary.lms.dto.DashboardDto> getDashboardStats() {
        com.smartlibrary.lms.dto.DashboardDto dto = new com.smartlibrary.lms.dto.DashboardDto();
        dto.setTotalInventoryTitles(bookRepository.count());
        long borrowedCount = 0;
        for (com.smartlibrary.lms.entity.Borrowing b : borrowingRepository.findAll()) {
            if (b.getStatus() != null && b.getStatus().toString().equals("ISSUED")) {
                borrowedCount++;
            }
        }
        dto.setCurrentlyBorrowedBooks(borrowedCount);
        dto.setOverdueHighPriorityCount(0); 
        dto.setNewUsers30Days(userRepository.count()); 
        List<com.smartlibrary.lms.entity.Category> cats = categoryRepository.findAll();
        if (!cats.isEmpty()) {
            com.smartlibrary.lms.entity.Category topCat = cats.get(0);
            dto.setTopCategoryName(topCat.getName());
            long catCount = 0;
            for(com.smartlibrary.lms.entity.Book b : bookRepository.findAll()) {
                if(b.getCategory() != null && b.getCategory().getId().equals(topCat.getId())) {
                    catCount++;
                }
            }
            dto.setTopCategoryCount(catCount);
        } else {
            dto.setTopCategoryName("No Categories Yet");
            dto.setTopCategoryCount(0);
        }
        org.springframework.data.domain.Pageable recentPageable = org.springframework.data.domain.PageRequest.of(0, 5, org.springframework.data.domain.Sort.by("id").descending());
        dto.setRecentlyAddedBooks(bookRepository.findAll(recentPageable).getContent());
        java.util.Map<com.smartlibrary.lms.entity.User, Long> userLoanCounts = new java.util.HashMap<>();
        java.util.Map<com.smartlibrary.lms.entity.User, java.time.LocalDate> userLastAction = new java.util.HashMap<>();
        for (com.smartlibrary.lms.entity.Borrowing b : borrowingRepository.findAll()) {
            if (b.getStatus() != null && b.getStatus().toString().equals("ISSUED")) {
                com.smartlibrary.lms.entity.User u = b.getUser();
                userLoanCounts.put(u, userLoanCounts.getOrDefault(u, 0L) + 1);
                if (!userLastAction.containsKey(u) || b.getIssueDate().isAfter(userLastAction.get(u))) {
                    userLastAction.put(u, b.getIssueDate()); 
                }
            }
        }
        java.util.List<java.util.Map<String, Object>> activeBorrowersList = new java.util.ArrayList<>();
        for (java.util.Map.Entry<com.smartlibrary.lms.entity.User, Long> entry : userLoanCounts.entrySet()) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("username", entry.getKey().getUsername());
            map.put("openLoans", entry.getValue());
            map.put("lastAction", userLastAction.get(entry.getKey()).toString()); 
            activeBorrowersList.add(map);
        }
        activeBorrowersList.sort((m1, m2) -> Long.compare((Long) m2.get("openLoans"), (Long) m1.get("openLoans")));
        if (activeBorrowersList.size() > 5) {
            activeBorrowersList = activeBorrowersList.subList(0, 5);
        }
        dto.setActiveBorrowers(activeBorrowersList);
        return org.springframework.http.ResponseEntity.ok(dto);
    }
   @GetMapping("/all")
    public org.springframework.http.ResponseEntity<?> getAllUsers() {
        java.util.List<com.smartlibrary.lms.entity.User> users = userRepository.findAll();
        java.util.List<com.smartlibrary.lms.entity.Borrowing> allBorrowings = borrowingRepository.findAll();
        java.util.List<java.util.Map<String, Object>> safeUsers = new java.util.ArrayList<>();
        for(com.smartlibrary.lms.entity.User u : users) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("email", u.getEmail() != null ? u.getEmail() : u.getUsername() + "@library.edu");
            String role = "Student";
            for(com.smartlibrary.lms.entity.Role r : u.getRoles()) {
                if(r.getName().equals("ROLE_ADMIN")) role = "Admin";
                else if(r.getName().equals("ROLE_TEACHER")) role = "Teacher";
            }
            map.put("role", role);
            map.put("systemId", (role.equals("Teacher") ? "TCH-" : "STU-") + "2024-" + String.format("%03d", u.getId()));
            long loans = allBorrowings.stream()
                    .filter(b -> b.getUser() != null && b.getUser().getId().equals(u.getId()))
                    .filter(b -> b.getStatus() != null && b.getStatus().toString().equals("ISSUED"))
                    .count();
            map.put("activeLoans", loans);
            map.put("status", "Active"); 
            map.put("department", "Computer Science");
            safeUsers.add(map);
        }
        return org.springframework.http.ResponseEntity.ok(safeUsers);
    }
}