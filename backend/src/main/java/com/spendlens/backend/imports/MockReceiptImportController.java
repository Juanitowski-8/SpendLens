package com.spendlens.backend.imports;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/imports")
public class MockReceiptImportController {

    private final MockReceiptImportService importService;

    public MockReceiptImportController(MockReceiptImportService importService) {
        this.importService = importService;
    }

    @PostMapping("/mock-receipts")
    public MockReceiptImportResult importMockReceipts(Authentication authentication) {
        return importService.importMockReceipts(authentication.getName());
    }
}