package com.spendlens.backend.dashboard;

import java.math.BigDecimal;

public class DashboardSummaryResponse {

    private BigDecimal totalSpent;
    private long expenseCount;
    private BigDecimal averageExpense;
    private String currency;

    public DashboardSummaryResponse(
            BigDecimal totalSpent,
            long expenseCount,
            BigDecimal averageExpense,
            String currency) {
        this.totalSpent = totalSpent;
        this.expenseCount = expenseCount;
        this.averageExpense = averageExpense;
        this.currency = currency;
    }

    public BigDecimal getTotalSpent() {
        return totalSpent;
    }

    public long getExpenseCount() {
        return expenseCount;
    }

    public BigDecimal getAverageExpense() {
        return averageExpense;
    }

    public String getCurrency() {
        return currency;
    }
}