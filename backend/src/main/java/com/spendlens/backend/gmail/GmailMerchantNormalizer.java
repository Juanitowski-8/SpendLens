package com.spendlens.backend.gmail;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class GmailMerchantNormalizer {

    public String normalize(String merchant) {
        if (merchant == null) {
            return "";
        }

        String normalized = merchant.trim().replaceAll("\\s+", " ");

        normalized = normalized.replaceAll("(?i)\\s+top deals$", "");
        normalized = normalized.replaceAll("(?i)\\s+deals$", "");
        normalized = normalized.replaceAll("(?i)\\s+newsletter$", "");

        return normalized.trim();
    }

    public boolean equalsNormalized(String left, String right) {
        return normalize(left).equalsIgnoreCase(normalize(right));
    }
}
