package com.smartlibrary.lms.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class NvidiaNimService {

    @Value("${nvidia.nim.api.key}")
    private String apiKey;

    @Value("${nvidia.nim.model:meta/llama3-70b-instruct}")
    private String model;

    private static final String NIM_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

    public String askLibrarian(String userMessage) {
        RestTemplate restTemplate = new RestTemplate();

        String systemPrompt = "You are Nexus, the highly advanced AI Librarian for the Nexus Smart Library system. " +
                "You have been trained on all Nexus AI Data and LMS features. " +
                "Here is your core knowledge base about the Nexus Smart Library System:\n" +
                "1. Book Management: The library tracks books by Title, Author, ISBN, Category, and Total/Available Copies. " +
                "2. Categories: We specialize in Computer Science, DevOps & Cloud, Operations Research, Data Science, Fiction & Manga, and Hardware & Architecture.\n" +
                "3. Borrowing System: Students can borrow books. Admins handle issuing and returning. " +
                "4. Fines: Overdue books incur fines (typically 10 units per day late).\n" +
                "5. Dashboards: Admins have a dashboard to manage users, books, and view System AI Insights (inventory, behavior, anomalies). Students have a 'My Loans' dashboard to track their borrowed books.\n" +
                "Your role is to assist patrons by answering questions based ONLY on these features and general book knowledge. " +
                "Always be polite, professional, and slightly futuristic in your tone. " +
                "Keep answers brief, highly informative, and directly related to the user's query. Do not invent features that are not listed here.";

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                ),
                "max_tokens", 1024
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            Map<String, Object> response = restTemplate.postForObject(NIM_API_URL, request, Map.class);
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return (String) message.get("content");
        } catch (Exception e) {
            System.err.println("NVIDIA NIM Error: " + e.getMessage());
            return "I'm sorry, the Nexus AI Librarian is currently offline for maintenance.";
        }
    }
}
