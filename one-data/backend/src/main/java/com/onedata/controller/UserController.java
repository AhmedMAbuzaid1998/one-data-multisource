package com.onedata.controller;

import com.onedata.model.TestUser;
import com.onedata.repository.TestUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private TestUserRepository repository;

    // GET /api/users — returns all users or filtered results
    @GetMapping
    public List<TestUser> getUsers(
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String environment,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String paymentType,
            @RequestParam(required = false) String accountId,
            @RequestParam(required = false) String serviceId) {

        return repository.filterUsers(
                market, environment, userType, role, paymentType, accountId, serviceId
        );
    }

    // GET /api/users/stats — summary counts for dashboard
    @GetMapping("/stats")
    public java.util.Map<String, Object> getStats() {
        long total = repository.count();
        return java.util.Map.of("total", total);
    }
}
