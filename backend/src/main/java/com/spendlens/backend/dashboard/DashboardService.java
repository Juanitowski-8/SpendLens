package com.spendlens.backend.dashboard;

import com.spendlens.backend.categories.Category;
import com.spendlens.backend.transactions.Transaction;
import com.spendlens.backend.transactions.TransactionResponse;
import com.spendlens.backend.transactions.TransactionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final TransactionService transactionService;

    public DashboardService(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary(String email, Integer year, Integer month) {
        List<Transaction> transactions = findTransactions(email, year, month);
        return buildSummary(transactions);
    }

    @Transactional(readOnly = true)
    public List<CategoryBreakdownResponse> getCategoryBreakdown(String email, Integer year, Integer month) {
        List<Transaction> transactions = findTransactions(email, year, month);

        if (transactions.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, List<Transaction>> grouped = transactions.stream()
                .collect(Collectors.groupingBy(transaction -> {
                    Category category = transaction.getCategory();
                    return category == null || category.getName() == null
                            ? "Sin categoría"
                            : category.getName();
                }));

        return grouped.entrySet().stream()
                .map(entry -> new CategoryBreakdownResponse(
                        entry.getKey(),
                        entry.getValue().stream()
                                .map(Transaction::getAmount)
                                .filter(amount -> amount != null)
                                .reduce(BigDecimal.ZERO, BigDecimal::add),
                        entry.getValue().size()))
                .sorted((left, right) -> right.getTotal().compareTo(left.getTotal()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getRecentExpenses(String email, Integer year, Integer month) {
        return findTransactions(email, year, month).stream()
                .limit(10)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private List<Transaction> findTransactions(String email, Integer year, Integer month) {
        return transactionService.findTransactionsForPeriod(email, year, month);
    }

    private DashboardSummaryResponse buildSummary(List<Transaction> transactions) {
        BigDecimal totalSpent = transactions.stream()
                .map(Transaction::getAmount)
                .filter(amount -> amount != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long expenseCount = transactions.size();

        BigDecimal averageExpense = expenseCount == 0
                ? BigDecimal.ZERO
                : totalSpent.divide(BigDecimal.valueOf(expenseCount), 2, RoundingMode.HALF_UP);

        String currency = transactions.stream()
                .map(Transaction::getCurrency)
                .filter(c -> c != null && !c.isBlank())
                .findFirst()
                .orElse("COP");

        return new DashboardSummaryResponse(totalSpent, expenseCount, averageExpense, currency);
    }

    private TransactionResponse toResponse(Transaction transaction) {
        Category category = transaction.getCategory();

        return new TransactionResponse(
                transaction.getId(),
                category != null ? category.getId() : null,
                category != null ? category.getName() : null,
                transaction.getMerchant(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getTransactionDate(),
                transaction.getDescription(),
                transaction.getSource(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt());
    }
}
