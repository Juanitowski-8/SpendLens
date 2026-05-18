package com.spendlens.backend.imports;

import com.spendlens.backend.transactions.TransactionResponse;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class MockReceiptImportResult {

    private int importedCount;
    private int skippedCount;
    private List<TransactionResponse> createdTransactions;
    private Map<String, Integer> skippedReasons;

    public MockReceiptImportResult(
            int importedCount,
            int skippedCount,
            List<TransactionResponse> createdTransactions
    ) {
        this(importedCount, skippedCount, createdTransactions, Collections.emptyMap());
    }

    public MockReceiptImportResult(
            int importedCount,
            int skippedCount,
            List<TransactionResponse> createdTransactions,
            Map<String, Integer> skippedReasons
    ) {
        this.importedCount = importedCount;
        this.skippedCount = skippedCount;
        this.createdTransactions = createdTransactions;
        this.skippedReasons = skippedReasons == null ? Collections.emptyMap() : new LinkedHashMap<>(skippedReasons);
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

    public Map<String, Integer> getSkippedReasons() {
        return skippedReasons;
    }
}
