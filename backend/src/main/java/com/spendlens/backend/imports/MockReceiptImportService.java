package com.spendlens.backend.imports;

import com.spendlens.backend.transactions.Transaction;
import com.spendlens.backend.transactions.TransactionRepository;
import com.spendlens.backend.transactions.TransactionResponse;
import com.spendlens.backend.transactions.TransactionSource;
import com.spendlens.backend.users.User;
import com.spendlens.backend.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class MockReceiptImportService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public MockReceiptImportService(
            TransactionRepository transactionRepository,
            UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    public MockReceiptImportResult importMockReceipts(String email) {
        User user = findUser(email);
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        List<MockReceiptDto> receipts = List.of(
                new MockReceiptDto("Uber", new BigDecimal("32400.00"), "COP", today.minusDays(1), "Viaje premium desde la app"),
                new MockReceiptDto("Netflix", new BigDecimal("29900.00"), "COP", today.minusDays(2), "Suscripción mensual"),
                new MockReceiptDto("Éxito", new BigDecimal("214300.00"), "COP", today.minusDays(4), "Compra de supermercado")
        );

        List<TransactionResponse> createdTransactions = new ArrayList<>();
        int importedCount = 0;

        for (MockReceiptDto receipt : receipts) {
            Transaction transaction = new Transaction(
                    UUID.randomUUID(),
                    user,
                    null,
                    receipt.getMerchant(),
                    receipt.getAmount(),
                    receipt.getCurrency(),
                    receipt.getTransactionDate(),
                    receipt.getDescription(),
                    TransactionSource.GMAIL,
                    now,
                    now);

            Transaction savedTransaction = transactionRepository.save(transaction);
            createdTransactions.add(toResponse(savedTransaction));
            importedCount++;
        }

        return new MockReceiptImportResult(importedCount, 0, createdTransactions);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND,
                        "User not found"));
    }

    private TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                null,
                null,
                transaction.getMerchant(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getTransactionDate(),
                transaction.getDescription(),
                transaction.getSource(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}