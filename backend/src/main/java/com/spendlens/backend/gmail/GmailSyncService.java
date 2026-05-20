package com.spendlens.backend.gmail;

import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.ListMessagesResponse;
import com.google.api.services.gmail.model.Message;
import com.google.api.services.gmail.model.MessagePartHeader;
import com.spendlens.backend.categories.Category;
import com.spendlens.backend.categories.CategoryService;
import com.spendlens.backend.imports.MockReceiptImportResult;
import com.spendlens.backend.transactions.Transaction;
import com.spendlens.backend.transactions.TransactionRepository;
import com.spendlens.backend.transactions.TransactionResponse;
import com.spendlens.backend.transactions.TransactionService;
import com.spendlens.backend.transactions.TransactionSource;
import com.spendlens.backend.users.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class GmailSyncService {

    private static final Logger log = LoggerFactory.getLogger(GmailSyncService.class);
    private static final String GMAIL_QUERY =
            "("
                    + "subject:(recibo OR receipt OR factura OR comprobante OR confirmación OR confirmacion) "
                    + "OR subject:(\"order confirmation\" OR \"tu pedido\" OR \"pago exitoso\" OR \"payment confirmation\")"
                    + ") -unsubscribe -newsletter";
    private static final long PAGE_SIZE = 100L;
    private static final int MAX_MESSAGES_TO_PROCESS = 25000;

    private final GmailOAuthService gmailOAuthService;
    private final GmailReceiptParser receiptParser;
    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final CategoryService categoryService;
    private final GmailCategoryAssigner categoryAssigner;
    private final GmailAmountValidator amountValidator;
    private final GmailPromotionalFilter promotionalFilter;
    private final GmailPurchaseClassifier purchaseClassifier;
    private final GmailMerchantNormalizer merchantNormalizer;

    public GmailSyncService(
            GmailOAuthService gmailOAuthService,
            GmailReceiptParser receiptParser,
            TransactionRepository transactionRepository,
            TransactionService transactionService,
            CategoryService categoryService,
            GmailCategoryAssigner categoryAssigner,
            GmailAmountValidator amountValidator,
            GmailPromotionalFilter promotionalFilter,
            GmailPurchaseClassifier purchaseClassifier,
            GmailMerchantNormalizer merchantNormalizer
    ) {
        this.gmailOAuthService = gmailOAuthService;
        this.receiptParser = receiptParser;
        this.transactionRepository = transactionRepository;
        this.transactionService = transactionService;
        this.categoryService = categoryService;
        this.categoryAssigner = categoryAssigner;
        this.amountValidator = amountValidator;
        this.promotionalFilter = promotionalFilter;
        this.purchaseClassifier = purchaseClassifier;
        this.merchantNormalizer = merchantNormalizer;
    }

    public MockReceiptImportResult sync(String userEmail) {
        GmailConnection connection = gmailOAuthService.getConnectionForUser(userEmail);
        connection = gmailOAuthService.refreshAccessTokenIfNeeded(connection);

        Gmail gmail = GmailClientFactory.build(connection.getAccessToken());
        User user = connection.getUser();

        int importedCount = 0;
        int skippedCount = 0;
        Map<String, Integer> skippedReasons = new LinkedHashMap<>();
        List<TransactionResponse> createdTransactions = new ArrayList<>();

        try {
            List<Message> messageRefs = new ArrayList<>();
            String pageToken = null;

            do {
                ListMessagesResponse listResponse = gmail.users().messages().list("me")
                        .setQ(GMAIL_QUERY)
                        .setMaxResults(PAGE_SIZE)
                        .setPageToken(pageToken)
                        .execute();

                List<Message> pageMessages = listResponse.getMessages();
                if (pageMessages != null && !pageMessages.isEmpty()) {
                    for (Message messageRef : pageMessages) {
                        if (messageRefs.size() >= MAX_MESSAGES_TO_PROCESS) {
                            break;
                        }
                        messageRefs.add(messageRef);
                    }
                }

                if (messageRefs.size() >= MAX_MESSAGES_TO_PROCESS) {
                    break;
                }

                pageToken = listResponse.getNextPageToken();
            } while (pageToken != null && !pageToken.isBlank());

            if (messageRefs.isEmpty()) {
                gmailOAuthService.markSynced(connection);
                return new MockReceiptImportResult(0, 0, createdTransactions, skippedReasons);
            }

            for (Message messageRef : messageRefs) {
                try {
                    Message message = gmail.users().messages().get("me", messageRef.getId())
                            .setFormat("metadata")
                            .setMetadataHeaders(List.of("Subject", "From", "Date"))
                            .execute();

                    String subject = headerValue(message, "Subject");
                    String from = headerValue(message, "From");
                    String dateHeader = headerValue(message, "Date");
                    String snippet = message.getSnippet();
                    Long internalDate = message.getInternalDate();

                    if (promotionalFilter.isPromotionalEmail(subject, snippet, from)) {
                        skippedCount++;
                        bump(skippedReasons, "promotional");
                        continue;
                    }

                    if (purchaseClassifier.isNonPurchaseContent(subject, snippet, from)) {
                        skippedCount++;
                        bump(skippedReasons, "not_a_purchase");
                        continue;
                    }

                    Optional<GmailReceiptParser.ParsedGmailReceipt> parsedReceipt = receiptParser.parse(
                            subject, snippet, from, dateHeader, internalDate
                    );

                    if (parsedReceipt.isEmpty()) {
                        skippedCount++;
                        bump(skippedReasons, "low_confidence");
                        continue;
                    }

                    GmailReceiptParser.ParsedGmailReceipt receipt = parsedReceipt.get();

                    if (!amountValidator.isReasonableAmount(
                            receipt.amount(), receipt.currency(), receipt.merchant(), subject, snippet
                    )) {
                        skippedCount++;
                        bump(skippedReasons, "invalid_amount");
                        continue;
                    }

                    String normalizedMerchant = merchantNormalizer.normalize(receipt.merchant());

                    if (isDuplicate(user.getId(), normalizedMerchant, receipt.amount(), receipt.transactionDate())) {
                        skippedCount++;
                        bump(skippedReasons, "duplicate");
                        continue;
                    }

                    Optional<Transaction> latestSimilar = findLatestSimilar(
                            user.getId(),
                            normalizedMerchant,
                            receipt.amount()
                    );
                    if (latestSimilar.isPresent()) {
                        Transaction existing = latestSimilar.get();
                        if (shouldCorrectExistingDate(existing, receipt.transactionDate())) {
                            existing.setTransactionDate(receipt.transactionDate());
                            existing.setDescription(receipt.description());
                            existing.setUpdatedAt(LocalDateTime.now());
                            Transaction corrected = transactionRepository.save(existing);
                            createdTransactions.add(transactionService.mapToResponse(corrected));
                            importedCount++;
                            continue;
                        }
                    }

                    String categoryName = categoryAssigner.assignCategory(normalizedMerchant, subject, snippet);
                    Category category = categoryService.getOrCreateByName(user.getEmail(), categoryName);

                    LocalDateTime now = LocalDateTime.now();
                    Transaction transaction = new Transaction(
                            UUID.randomUUID(),
                            user,
                            category,
                            normalizedMerchant,
                            receipt.amount(),
                            "COP",
                            receipt.transactionDate(),
                            receipt.description(),
                            TransactionSource.GMAIL,
                            now,
                            now
                    );

                    Transaction saved = transactionRepository.save(transaction);
                    createdTransactions.add(transactionService.mapToResponse(saved));
                    importedCount++;
                } catch (Exception exception) {
                    skippedCount++;
                    bump(skippedReasons, "error");
                    log.debug("Skipped Gmail message during sync");
                }
            }

            gmailOAuthService.markSynced(connection);
        } catch (IOException exception) {
            log.warn("Gmail sync failed");
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Could not sync Gmail messages"
            );
        }

        return new MockReceiptImportResult(importedCount, skippedCount, createdTransactions, skippedReasons);
    }

    private void bump(Map<String, Integer> reasons, String key) {
        reasons.merge(key, 1, Integer::sum);
    }

    private boolean isDuplicate(UUID userId, String merchant, BigDecimal amount, LocalDate transactionDate) {
        return transactionRepository.existsByUser_IdAndSourceAndMerchantIgnoreCaseAndAmountAndTransactionDate(
                userId, TransactionSource.GMAIL, merchant, amount, transactionDate
        );
    }

    private Optional<Transaction> findLatestSimilar(UUID userId, String merchant, BigDecimal amount) {
        return transactionRepository.findFirstByUser_IdAndSourceAndMerchantIgnoreCaseAndAmountOrderByUpdatedAtDesc(
                userId, TransactionSource.GMAIL, merchant, amount
        );
    }

    private boolean shouldCorrectExistingDate(Transaction existing, LocalDate parsedDate) {
        if (existing.getTransactionDate() == null || parsedDate == null) {
            return false;
        }
        if (existing.getTransactionDate().isEqual(parsedDate)) {
            return false;
        }
        String description = existing.getDescription() == null ? "" : existing.getDescription();
        return description.startsWith("Gmail:");
    }

    private String headerValue(Message message, String headerName) {
        if (message.getPayload() == null || message.getPayload().getHeaders() == null) {
            return "";
        }
        for (MessagePartHeader header : message.getPayload().getHeaders()) {
            if (headerName.equalsIgnoreCase(header.getName())) {
                return header.getValue() == null ? "" : header.getValue();
            }
        }
        return "";
    }
}
