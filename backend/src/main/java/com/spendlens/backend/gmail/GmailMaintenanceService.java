package com.spendlens.backend.gmail;

import com.spendlens.backend.categories.Category;
import com.spendlens.backend.categories.CategoryService;
import com.spendlens.backend.transactions.Transaction;
import com.spendlens.backend.transactions.TransactionRepository;
import com.spendlens.backend.transactions.TransactionResponse;
import com.spendlens.backend.transactions.TransactionService;
import com.spendlens.backend.transactions.TransactionSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class GmailMaintenanceService {

    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final CategoryService categoryService;
    private final GmailCategoryAssigner categoryAssigner;
    private final GmailAmountValidator amountValidator;
    private final GmailPromotionalFilter promotionalFilter;

    public GmailMaintenanceService(
            TransactionRepository transactionRepository,
            TransactionService transactionService,
            CategoryService categoryService,
            GmailCategoryAssigner categoryAssigner,
            GmailAmountValidator amountValidator,
            GmailPromotionalFilter promotionalFilter
    ) {
        this.transactionRepository = transactionRepository;
        this.transactionService = transactionService;
        this.categoryService = categoryService;
        this.categoryAssigner = categoryAssigner;
        this.amountValidator = amountValidator;
        this.promotionalFilter = promotionalFilter;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> findSuspiciousTransactions(String email) {
        return findSuspiciousEntities(email).stream()
                .map(transactionService::mapToResponse)
                .toList();
    }

    public GmailCountResponse deleteSuspiciousTransactions(String email) {
        List<Transaction> suspicious = findSuspiciousEntities(email);

        if (!suspicious.isEmpty()) {
            transactionRepository.deleteAll(suspicious);
        }

        return new GmailCountResponse(suspicious.size());
    }

    public GmailCountResponse recategorizeGmailTransactions(String email) {
        String normalizedEmail = normalizeEmail(email);
        List<Transaction> gmailTransactions = transactionRepository
                .findByUserEmailAndSource(normalizedEmail, TransactionSource.GMAIL);

        int updatedCount = 0;
        LocalDateTime now = LocalDateTime.now();

        for (Transaction transaction : gmailTransactions) {
            if (transaction.getCategory() != null) {
                String existing = transaction.getCategory().getName();
                if (existing != null
                        && !existing.equalsIgnoreCase("Otros")
                        && !existing.equalsIgnoreCase("Sin categoría")) {
                    continue;
                }
            }

            ParsedEmailContent content = ParsedEmailContent.fromDescription(transaction.getDescription());
            String categoryName = categoryAssigner.assignCategory(
                    transaction.getMerchant(),
                    content.subject(),
                    content.snippet()
            );

            Category category = categoryService.getOrCreateByName(normalizedEmail, categoryName);
            if (category == null) {
                continue;
            }

            transaction.setCategory(category);
            transaction.setUpdatedAt(now);
            transactionRepository.save(transaction);
            updatedCount++;
        }

        return new GmailCountResponse(updatedCount);
    }

    private List<Transaction> findSuspiciousEntities(String email) {
        String normalizedEmail = normalizeEmail(email);
        List<Transaction> gmailTransactions = transactionRepository
                .findByUserEmailAndSource(normalizedEmail, TransactionSource.GMAIL);

        List<Transaction> suspicious = new ArrayList<>();

        for (Transaction transaction : gmailTransactions) {
            if (isSuspicious(transaction)) {
                suspicious.add(transaction);
            }
        }

        return suspicious;
    }

    private boolean isSuspicious(Transaction transaction) {
        return amountValidator.isSuspiciousGmailTransaction(
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getMerchant(),
                transaction.getDescription()
        ) || promotionalFilter.isPromotionalMerchantOrDescription(
                transaction.getMerchant(),
                transaction.getDescription()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private record ParsedEmailContent(String subject, String snippet) {
        private static ParsedEmailContent fromDescription(String description) {
            if (description == null || description.isBlank()) {
                return new ParsedEmailContent("", "");
            }

            String withoutPrefix = description.startsWith("Gmail: ")
                    ? description.substring("Gmail: ".length())
                    : description;

            String[] parts = withoutPrefix.split(" — ", 2);
            if (parts.length == 2) {
                return new ParsedEmailContent(parts[0].trim(), parts[1].trim());
            }

            return new ParsedEmailContent(withoutPrefix.trim(), "");
        }
    }
}
