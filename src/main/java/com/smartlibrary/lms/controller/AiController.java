package com.smartlibrary.lms.controller;
import com.smartlibrary.lms.service.NvidiaNimService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {
    private final NvidiaNimService nvidiaNimService;
    public AiController(NvidiaNimService nvidiaNimService) {
        this.nvidiaNimService = nvidiaNimService;
    }
    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chatWithLibrarian(@RequestBody Map<String, String> request) {
        String userMessage = request.get("message");
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("response", "Message cannot be empty."));
        }
        String aiResponse = nvidiaNimService.askLibrarian(userMessage);
        return ResponseEntity.ok(Map.of("response", aiResponse));
    }
}