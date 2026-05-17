package com.spendlens.backend.imports;

import com.spendlens.backend.transactions.TransactionResponse;

import java.util.List;

public class MockReceiptImportResult {

    private int importedCount;
    private int skippedCount;
    private List<TransactionResponse> createdTransactions;

    public MockReceiptImportResult(
            int importedCount,
            int skippedCount,
            List<TransactionResponse> createdTransactions) {
        this.importedCount = importedCount;
        this.skippedCount = skippedCount;
        this.createdTransactions = createdTransactions;
    }

    public int getImportedCount() {
        return importedCount;
    }

    public int getSkippedCount() {
        return skippedCount;
    }

    public List<TransactionResponse> getCreatedTransactions() {
        return createdTransactions;
    }
}