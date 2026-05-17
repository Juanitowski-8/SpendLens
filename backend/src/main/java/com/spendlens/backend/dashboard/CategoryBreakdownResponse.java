package com.spendlens.backend.dashboard;

import java.math.BigDecimal;

public class CategoryBreakdownResponse {

    private String categoryName;
    private BigDecimal total;
    private long count;

    public CategoryBreakdownResponse(
            String categoryName,
            BigDecimal total,
            long count) {
        this.categoryName = categoryName;
        this.total = total;
        this.count = count;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public long getCount() {
        return count;
    }
}