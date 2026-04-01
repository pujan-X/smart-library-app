# 📚 Nexus.AI - Smart Library Management System

![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=java&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Nexus.AI is a modern, responsive, and AI-powered Full-Stack Library Management System (LMS). Designed with a premium dark-mode UI, it allows administrators to seamlessly manage library inventory while providing students with an intuitive catalog to browse and borrow books. 

The application is fully containerized and deployed in the cloud, utilizing a secure relational database and integrating Google's Gemini API for intelligent insights.

## ✨ Key Features

* **Role-Based Access Control (RBAC):** Secure authentication separating `ADMIN` (full inventory control) and `USER/STUDENT` (browsing and borrowing) functionalities.
* **Dynamic Dashboard:** Real-time metrics tracking total books, current borrows, overdue items, and new member registrations.
* **Responsive Modern UI:** Fully mobile-optimized interface with custom dropdowns, interactive tables, and a sleek Tailwind CSS design.
* **Cloud-Native Architecture:** Containerized via Docker and hosted on Render, communicating with an Aiven Cloud MySQL database.
* **AI Integration:** Powered by the Google Gemini API for advanced catalog insights and automated librarian assistance.

## 🛠️ Tech Stack

**Frontend:**
* HTML5 / Custom CSS
* Tailwind CSS (Styling & Responsive Layouts)
* Vanilla JavaScript (DOM Manipulation & API Integration)
* FontAwesome (Icons)

**Backend:**
* Java 17+
* Spring Boot 3.x
* Spring Security (Authentication & Authorization)
* Spring Data JPA (Hibernate)
* Maven

**Database & DevOps:**
* MySQL (Hosted on Aiven Cloud)
* Docker (Containerization)
* Render (Cloud Deployment)

## 🚀 Live Demo
**[Click here to view the live application!](https://nexus-ai-lms.onrender.com)** *(Note: As this is hosted on a free cloud tier, the server may take 50-60 seconds to wake up upon initial load.)*

## 💻 Local Development Setup

If you wish to run this project locally, follow these steps:

### Prerequisites
* Java Development Kit (JDK) 17 or higher
* Maven
* MySQL Server installed locally

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/smart-library-app.git](https://github.com/YOUR_USERNAME/smart-library-app.git)
cd smart-library-app
