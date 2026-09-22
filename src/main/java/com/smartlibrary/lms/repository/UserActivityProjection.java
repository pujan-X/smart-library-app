package com.smartlibrary.lms.repository;
import java.time.LocalDateTime;
public interface UserActivityProjection {
    Long getId();
    String getFullName();
    String getUsername();
    long getOpenLoansCount();
    LocalDateTime getLastLogin();
}