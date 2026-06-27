package com.onedata.controller;

import com.onedata.model.TestUser;
import com.onedata.repository.TestUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/token")
@CrossOrigin(origins = "http://localhost:5173")
public class TokenController {

    @Autowired
    private TestUserRepository repository;

    // POST /api/token/{id} — generates a dummy token for a user
    @PostMapping("/{id}")
    public Map<String, String> generateToken(@PathVariable Long id) {
        TestUser user = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        // TODO Phase 4: replace with real Appium framework call
        String token = "ODT-" +
                user.getMarket() + "-" +
                user.getEnvironment() + "-" +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        return Map.of(
                "userId",      String.valueOf(id),
                "username",    user.getUsername(),
                "token",       token,
                "environment", user.getEnvironment(),
                "market",      user.getMarket(),
                "status",      "success"
        );
    }
}
