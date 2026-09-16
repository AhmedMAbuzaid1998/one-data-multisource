package com.onedata.service;

import com.onedata.model.TestUser;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ExcelImportService {
    private static final List<String> REQUIRED_COLUMNS = List.of(
            "username", "market", "environment", "usertype", "role", "paymenttype", "accountid", "serviceid"
    );

    public List<TestUser> parse(InputStream inputStream) throws IOException {
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            if (workbook.getNumberOfSheets() == 0) {
                throw new IllegalArgumentException("The workbook does not contain a worksheet.");
            }

            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            if (headerRow == null) {
                throw new IllegalArgumentException("The first worksheet is empty.");
            }

            DataFormatter formatter = new DataFormatter(Locale.ROOT);
            Map<String, Integer> columns = readColumns(headerRow, formatter);
            List<String> missing = REQUIRED_COLUMNS.stream().filter(column -> !columns.containsKey(column)).toList();
            if (!missing.isEmpty()) {
                throw new IllegalArgumentException("Missing required columns: " + String.join(", ", missing));
            }

            List<TestUser> users = new ArrayList<>();
            long temporaryId = -1;
            for (int index = headerRow.getRowNum() + 1; index <= sheet.getLastRowNum(); index++) {
                Row row = sheet.getRow(index);
                if (row == null) continue;
                String username = value(row, columns.get("username"), formatter);
                if (username.isBlank()) continue;

                TestUser user = new TestUser(
                        username,
                        value(row, columns.get("market"), formatter),
                        value(row, columns.get("environment"), formatter),
                        value(row, columns.get("usertype"), formatter),
                        value(row, columns.get("role"), formatter),
                        value(row, columns.get("paymenttype"), formatter),
                        value(row, columns.get("accountid"), formatter),
                        value(row, columns.get("serviceid"), formatter)
                );
                user.setId(temporaryId--);
                users.add(user);
            }

            if (users.isEmpty()) {
                throw new IllegalArgumentException("No rows with a username were found.");
            }
            return users;
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalArgumentException("The file could not be read as an Excel workbook.", exception);
        }
    }

    private Map<String, Integer> readColumns(Row row, DataFormatter formatter) {
        Map<String, Integer> columns = new HashMap<>();
        row.forEach(cell -> columns.put(normalize(formatter.formatCellValue(cell)), cell.getColumnIndex()));
        return columns;
    }

    private String normalize(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private String value(Row row, int column, DataFormatter formatter) {
        if (row.getCell(column) == null) return "";
        return formatter.formatCellValue(row.getCell(column)).trim();
    }
}
