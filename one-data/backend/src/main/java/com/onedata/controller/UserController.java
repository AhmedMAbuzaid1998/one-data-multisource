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

    @PostMapping(value = "/import-tables", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> importTables(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty() || file.getSize() > 10 * 1024 * 1024) return ResponseEntity.badRequest().body(Map.of("message", "Choose a workbook up to 10 MB."));
        try (var workbook = org.apache.poi.ss.usermodel.WorkbookFactory.create(file.getInputStream())) {
            var formatter = new org.apache.poi.ss.usermodel.DataFormatter(java.util.Locale.ROOT);
            formatter.setUseCachedValuesForFormulaCells(true);
            var tables = new java.util.ArrayList<Map<String,Object>>();
            int total = 0;
            for (var sheet : workbook) {
                var header = sheet.getRow(sheet.getFirstRowNum());
                if (header == null) continue;
                if (header.getLastCellNum() > 200) throw new IllegalArgumentException("Maximum 200 columns per sheet.");
                var names = new java.util.LinkedHashMap<Integer,String>();
                var used = new java.util.HashSet<String>();
                for (var cell : header) {
                    String name = formatter.formatCellValue(cell).trim();
                    if (name.isBlank()) continue;
                    if (!used.add(name.toLowerCase(java.util.Locale.ROOT))) throw new IllegalArgumentException("Duplicate header in " + sheet.getSheetName() + ": " + name);
                    names.put(cell.getColumnIndex(), name);
                }
                if (names.isEmpty()) continue;
                var records = new java.util.ArrayList<Map<String,Object>>();
                for (int r=header.getRowNum()+1; r<=sheet.getLastRowNum(); r++) {
                    var row = sheet.getRow(r); if (row==null) continue;
                    var record = new java.util.LinkedHashMap<String,Object>(); boolean populated=false;
                    for (var entry : names.entrySet()) {
                        String value = formatter.formatCellValue(row.getCell(entry.getKey()));
                        var cell = row.getCell(entry.getKey());
                        record.put(entry.getValue(), value.isBlank() ? null : cell != null && cell.getCellType() == org.apache.poi.ss.usermodel.CellType.BOOLEAN ? cell.getBooleanCellValue() : value); if (!value.isBlank()) populated=true;
                    }
                    if (populated) { records.add(record); if (++total > 10000) throw new IllegalArgumentException("Maximum 10,000 rows per workbook."); }
                }
                if (!records.isEmpty()) tables.add(Map.of("name", sheet.getSheetName(), "records", records));
            }
            if (tables.isEmpty()) throw new IllegalArgumentException("No data rows found. Put column headers in the first row of each sheet.");
            return ResponseEntity.ok(tables);
        } catch (IllegalArgumentException ex) { return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage())); }
        catch (Exception ex) { return ResponseEntity.badRequest().body(Map.of("message", "The workbook could not be read.")); }
    }
}
