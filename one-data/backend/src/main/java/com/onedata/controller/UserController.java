package com.onedata.controller;

import com.onedata.model.TestUser;
import com.onedata.repository.TestUserRepository;
import com.onedata.service.ExcelImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class UserController {

    @Autowired
    private TestUserRepository repository;

    @Autowired
    private ExcelImportService excelImportService;

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

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> importPersonalWorkbook(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Choose a non-empty Excel file."));
        }
        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only .xlsx and .xls files are supported."));
        }
        try {
            return ResponseEntity.ok(excelImportService.parse(file.getInputStream()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "The workbook could not be processed."));
        }
    }
}
