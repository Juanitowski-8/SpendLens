package com.spendlens.backend.gmail;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Locale;

@Component
public class GmailAmountValidator {

    public static final BigDecimal MIN_REASONABLE_COP_AMOUNT = new BigDecimal("1000");
    public static final BigDecimal MAX_REASONABLE_COP_AMOUNT = new BigDecimal("20000000");

    private static final String[] FOREIGN_CURRENCY_MARKERS = {
            "usd",
            "us$",
            "u$s",
            "cad",
            "ca$",
            "dollar",
            "dollars",
            "canadian dollar",
            "eur",
            "€"
    };

    public boolean isReasonableAmount(
            BigDecimal amount,
            String currency,
            String merchant,
            String subject,
            String snippet
    ) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }

        String combined = buildHaystack(merchant, subject, snippet);

        if (mentionsForeignCurrency(combined) && !combined.contains("cop")) {
            return false;
        }

        if (!"COP".equalsIgnoreCase(currency)) {
            return false;
        }

        if (amount.compareTo(MIN_REASONABLE_COP_AMOUNT) < 0) {
            if (mentionsForeignCurrency(combined) || combined.contains("$")) {
                return false;
            }
            return false;
        }

        return amount.compareTo(MAX_REASONABLE_COP_AMOUNT) <= 0;
    }

    public boolean isSuspiciousGmailTransaction(
            BigDecimal amount,
            String currency,
            String merchant,
            String description
    ) {
        if (amount == null) {
            return true;
        }

        if ("COP".equalsIgnoreCase(currency)) {
            if (amount.compareTo(MIN_REASONABLE_COP_AMOUNT) < 0
                    || amount.compareTo(MAX_REASONABLE_COP_AMOUNT) > 0) {
                return true;
            }
        } else {
            return true;
        }

        String merchantLower = safe(merchant).toLowerCase(Locale.ROOT);
        if (merchantLower.contains("deals") || merchantLower.contains("top deal")) {
            return true;
        }

        return mentionsForeignCurrency(buildHaystack(merchant, description, ""))
                && !buildHaystack(merchant, description, "").contains("cop");
    }

    public boolean mentionsForeignCurrency(String text) {
        String lower = safe(text).toLowerCase(Locale.ROOT);

        for (String marker : FOREIGN_CURRENCY_MARKERS) {
            if (lower.contains(marker)) {
                return true;
            }
        }

        return false;
    }

    public boolean shouldRejectCurrency(String currency, String subject, String snippet) {
        if ("COP".equalsIgnoreCase(currency)) {
            return false;
        }

        String combined = buildHaystack(subject, snippet, "");
        return mentionsForeignCurrency(combined) || !"COP".equalsIgnoreCase(currency);
    }

    private String buildHaystack(String... parts) {
        return (" " + String.join(" ", parts) + " ").toLowerCase(Locale.ROOT);
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
