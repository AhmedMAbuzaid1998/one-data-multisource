package com.onedata;

import com.onedata.model.TestUser;
import com.onedata.repository.TestUserRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner loadData(TestUserRepository repository) {
        return args -> {
            try {
                // Load Excel file from resources folder
                InputStream is = new ClassPathResource("testdata.xlsx").getInputStream();
                Workbook workbook = new XSSFWorkbook(is);
                Sheet sheet = workbook.getSheetAt(0);

                int loaded = 0;
                // Skip header row (row 0), start from row 1
                for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                    Row row = sheet.getRow(i);
                    if (row == null) continue;

                    String username    = getCellValue(row, 0);
                    String market      = getCellValue(row, 1);
                    String environment = getCellValue(row, 2);
                    String userType    = getCellValue(row, 3);
                    String role        = getCellValue(row, 4);
                    String paymentType = getCellValue(row, 5);
                    String accountId   = getCellValue(row, 6);
                    String serviceId   = getCellValue(row, 7);

                    if (username == null || username.isEmpty()) continue;

                    repository.save(new TestUser(
                            username, market, environment,
                            userType, role, paymentType,
                            accountId, serviceId
                    ));
                    loaded++;
                }

                workbook.close();
                System.out.println("=== One Data: loaded " + loaded + " users from Excel ===");

            } catch (Exception e) {
                System.err.println("=== One Data: Failed to load Excel: " + e.getMessage());
                System.err.println("=== Make sure testdata.xlsx is in src/main/resources/ ===");
            }
        };
    }

    private String getCellValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> "";
        };
    }
}
