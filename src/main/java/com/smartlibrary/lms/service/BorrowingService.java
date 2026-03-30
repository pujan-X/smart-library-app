package com.smartlibrary.lms.service;

import com.smartlibrary.lms.entity.Borrowing;

public interface BorrowingService {
    Borrowing issueBook(Long userId, Long bookId);
    Borrowing returnBook(Long borrowingId);
}