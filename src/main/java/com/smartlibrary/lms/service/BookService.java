package com.smartlibrary.lms.service;
import com.smartlibrary.lms.entity.Book;
import java.util.List;
public interface BookService {
    Book addBook(Book book);
    List<Book> getAllBooks();
    List<Book> searchBooks(String keyword);
    Book getBookById(Long id);
    Book updateBook(Long id, Book bookDetails);
    void deleteBook(Long id);
}