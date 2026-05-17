package com.spendlens.backend.imports;

import java.math.BigDecimal;
import java.time.LocalDate;

public class MockReceiptDto {

    private String merchant;
    private BigDecimal amount;
    private String currency;
    private LocalDate transactionDate;
    private String description;

    public MockReceiptDto(
            String merchant,
            BigDecimal amount,
            String currency,
            LocalDate transactionDate,
            String description) {
        this.merchant = merchant;
        this.amount = amount;
        this.currency = currency;
        this.transactionDate = transactionDate;
        this.description = description;
    }

    public String getMerchant() {
        return merchant;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public String getDescription() {
        return description;
    }
}