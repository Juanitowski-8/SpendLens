package com.spendlens.backend.imports;

import com.spendlens.backend.transactions.Transaction;
import com.spendlens.backend.transactions.TransactionRepository;
import com.spendlens.backend.transactions.TransactionResponse;
import com.spendlens.backend.transactions.TransactionSource;
import com.spendlens.backend.users.User;
import com.spendlens.backend.users.UserRepository;
import org.springframework.http.HttpStatus;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
                    now
            );

            Transaction savedTransaction = transactionRepository.save(transaction);
            createdTransactions.add(toResponse(savedTransaction));
            importedCount++;
        }

        return new MockReceiptImportResult(importedCount, 0, createdTransactions);
    }

    public MockReceiptImportResult importFromText(String email, String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Text is required");
        }

        User user = findUser(email);
        ParsedReceiptDto parsedReceipt = parseReceiptText(text);

        LocalDateTime now = LocalDateTime.now();

        Transaction transaction = new Transaction(
                UUID.randomUUID(),
                user,
                null,
                parsedReceipt.getMerchant(),
                parsedReceipt.getAmount(),
                parsedReceipt.getCurrency(),
                parsedReceipt.getTransactionDate(),
                parsedReceipt.getDescription(),
                TransactionSource.GMAIL,
                now,
                now
        );

        Transaction savedTransaction = transactionRepository.save(transaction);
        List<TransactionResponse> createdTransactions = List.of(toResponse(savedTransaction));

        return new MockReceiptImportResult(1, 0, createdTransactions);
    }

    private ParsedReceiptDto parseReceiptText(String text) {
        String normalizedText = text.trim();

        String merchant = extractMerchant(normalizedText);
        BigDecimal amount = extractAmount(normalizedText);
        String currency = extractCurrency(normalizedText);
        LocalDate transactionDate = extractDate(normalizedText);

        return new ParsedReceiptDto(
                merchant,
                amount,
                currency,
                transactionDate,
                "Importado desde texto pegado: " + normalizedText
        );
    }

    private String extractMerchant(String text) {
        String lower = text.toLowerCase(Locale.ROOT);

        if (lower.contains("uber")) {
            return "Uber";
        }

        if (lower.contains("netflix")) {
            return "Netflix";
        }

        if (lower.contains("rappi")) {
            return "Rappi";
        }

        if (lower.contains("exito") || lower.contains("éxito")) {
            return "Éxito";
        }

        if (lower.contains("spotify")) {
            return "Spotify";
        }

        Pattern merchantPattern = Pattern.compile(
                "(?i)(?:recibo de|compra en|pago a|comercio:)\\s+([\\p{L}\\p{N}\\s]+)"
        );
        Matcher matcher = merchantPattern.matcher(text);

        if (matcher.find()) {
            return matcher.group(1).trim();
        }

        return "Comercio detectado";
    }

    private BigDecimal extractAmount(String text) {
    Pattern amountWithCurrencyPattern = Pattern.compile(
            "(\\d+(?:[.,]\\d{1,2})?)\\s*(?:COP|USD|EUR)",
            Pattern.CASE_INSENSITIVE
    );

    Matcher currencyMatcher = amountWithCurrencyPattern.matcher(text);

    if (currencyMatcher.find()) {
        return parseAmount(currencyMatcher.group(1));
    }

    Pattern amountAfterMoneyWordsPattern = Pattern.compile(
            "(?i)(?:por|valor de|total de|monto de|pag[oó])\\s+\\$?\\s*(\\d+(?:[.,]\\d{1,2})?)"
    );

    Matcher moneyWordsMatcher = amountAfterMoneyWordsPattern.matcher(text);

    if (moneyWordsMatcher.find()) {
        return parseAmount(moneyWordsMatcher.group(1));
    }

    Pattern fallbackAmountPattern = Pattern.compile("\\$?\\s*(\\d+(?:[.,]\\d{1,2})?)");
    Matcher fallbackMatcher = fallbackAmountPattern.matcher(text);

    while (fallbackMatcher.find()) {
        BigDecimal amount = parseAmount(fallbackMatcher.group(1));

        if (amount.compareTo(BigDecimal.ZERO) > 0) {
            return amount;
        }
    }

    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not detect amount from text");
}

private BigDecimal parseAmount(String rawAmount) {
    String cleanedAmount = rawAmount.trim();

    if (cleanedAmount.contains(",") && cleanedAmount.contains(".")) {
        cleanedAmount = cleanedAmount.replace(".", "").replace(",", ".");
    } else if (cleanedAmount.contains(",")) {
        cleanedAmount = cleanedAmount.replace(",", ".");
    }

    return new BigDecimal(cleanedAmount);
}

    private String extractCurrency(String text) {
        String upper = text.toUpperCase(Locale.ROOT);

        if (upper.contains("USD")) {
            return "USD";
        }

        if (upper.contains("EUR")) {
            return "EUR";
        }

        return "COP";
    }

    private LocalDate extractDate(String text) {
        Pattern isoDatePattern = Pattern.compile("(\\d{4}-\\d{2}-\\d{2})");
        Matcher isoMatcher = isoDatePattern.matcher(text);

        if (isoMatcher.find()) {
            return LocalDate.parse(isoMatcher.group(1));
        }

        return LocalDate.now();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
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
                transaction.getUpdatedAt()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}