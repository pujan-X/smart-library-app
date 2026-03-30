package com.smartlibrary.lms.dto;

import com.smartlibrary.lms.entity.Book;
import java.util.List;
import java.util.Map;

public class DashboardDto {
    private long totalInventoryTitles;
    private long currentlyBorrowedBooks;
    private long overdueHighPriorityCount;
    private long newUsers30Days;
    private String topCategoryName;
    private long topCategoryCount;
    private List<Book> recentlyAddedBooks;
    
    private List<Map<String, Object>> activeBorrowers;

    public long getTotalInventoryTitles() { return totalInventoryTitles; }
    public void setTotalInventoryTitles(long totalInventoryTitles) { this.totalInventoryTitles = totalInventoryTitles; }

    public long getCurrentlyBorrowedBooks() { return currentlyBorrowedBooks; }
    public void setCurrentlyBorrowedBooks(long currentlyBorrowedBooks) { this.currentlyBorrowedBooks = currentlyBorrowedBooks; }

    public long getOverdueHighPriorityCount() { return overdueHighPriorityCount; }
    public void setOverdueHighPriorityCount(long overdueHighPriorityCount) { this.overdueHighPriorityCount = overdueHighPriorityCount; }

    public long getNewUsers30Days() { return newUsers30Days; }
    public void setNewUsers30Days(long newUsers30Days) { this.newUsers30Days = newUsers30Days; }

    public String getTopCategoryName() { return topCategoryName; }
    public void setTopCategoryName(String topCategoryName) { this.topCategoryName = topCategoryName; }

    public long getTopCategoryCount() { return topCategoryCount; }
    public void setTopCategoryCount(long topCategoryCount) { this.topCategoryCount = topCategoryCount; }

    public List<Book> getRecentlyAddedBooks() { return recentlyAddedBooks; }
    public void setRecentlyAddedBooks(List<Book> recentlyAddedBooks) { this.recentlyAddedBooks = recentlyAddedBooks; }

    public List<Map<String, Object>> getActiveBorrowers() { return activeBorrowers; }
    public void setActiveBorrowers(List<Map<String, Object>> activeBorrowers) { this.activeBorrowers = activeBorrowers; }
}