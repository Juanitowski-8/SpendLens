package com.spendlens.backend.transactions;

import com.spendlens.backend.categories.Category;
import com.spendlens.backend.categories.CategoryRepository;
import com.spendlens.backend.users.User;
import com.spendlens.backend.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public TransactionService(
            TransactionRepository transactionRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> findAll(String email, Integer year, Integer month) {
        return findTransactionsForPeriod(email, year, month)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Transaction> findTransactionsForPeriod(String email, Integer year, Integer month) {
        String normalizedEmail = normalizeEmail(email);
        YearMonth period = com.spendlens.backend.dashboard.DashboardPeriod.resolve(year, month);

        if (period == null) {
            return transactionRepository.findByUserEmailOrderByTransactionDateDescCreatedAtDesc(normalizedEmail);
        }

        LocalDate start = com.spendlens.backend.dashboard.DashboardPeriod.startDate(period);
        LocalDate end = com.spendlens.backend.dashboard.DashboardPeriod.endDate(period);

        return transactionRepository
                .findByUserEmailAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(
                        normalizedEmail,
                        start,
                        end
                );
    }

    @Transactional(readOnly = true)
    public TransactionResponse findById(UUID id, String email) {
        Transaction transaction = transactionRepository
                .findByIdAndUserEmail(id, normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transaction not found"));

        return toResponse(transaction);
    }

    public TransactionResponse create(CreateTransactionRequest request, String email) {
        User user = getUser(email);
        Category category = getCategoryIfPresent(request.getCategoryId(), email);

        LocalDateTime now = LocalDateTime.now();

        Transaction transaction = new Transaction(
                UUID.randomUUID(),
                user,
                category,
                request.getMerchant().trim(),
                request.getAmount(),
                normalizeCurrency(request.getCurrency()),
                request.getTransactionDate(),
                cleanText(request.getDescription()),
                TransactionSource.MANUAL,
                now,
                now);

        Transaction savedTransaction = transactionRepository.save(transaction);

        return toResponse(savedTransaction);
    }

    public TransactionResponse update(UUID id, UpdateTransactionRequest request, String email) {
        Transaction transaction = transactionRepository
                .findByIdAndUserEmail(id, normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transaction not found"));

        Category category = getCategoryIfPresent(request.getCategoryId(), email);

        transaction.setCategory(category);
        transaction.setMerchant(request.getMerchant().trim());
        transaction.setAmount(request.getAmount());
        transaction.setCurrency(normalizeCurrency(request.getCurrency()));
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setDescription(cleanText(request.getDescription()));
        transaction.setUpdatedAt(LocalDateTime.now());

        Transaction savedTransaction = transactionRepository.save(transaction);

        return toResponse(savedTransaction);
    }

    public void delete(UUID id, String email) {
        Transaction transaction = transactionRepository
                .findByIdAndUserEmail(id, normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transaction not found"));

        transactionRepository.delete(transaction);
    }

    private User getUser(String email) {
        return userRepository
                .findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"));
    }

    private Category getCategoryIfPresent(UUID categoryId, String email) {
        if (categoryId == null) {
            return null;
        }

        return categoryRepository
                .findByIdAndUserEmail(categoryId, normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"));
    }

    private TransactionResponse toResponse(Transaction transaction) {
        Category category = transaction.getCategory();

        UUID categoryId = null;
        String categoryName = null;

        if (category != null) {
            categoryId = category.getId();
            categoryName = category.getName();
        }

        return new TransactionResponse(
                transaction.getId(),
                categoryId,
                categoryName,
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

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "COP";
        }

        return currency.trim().toUpperCase(Locale.ROOT);
    }

    private String cleanText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}