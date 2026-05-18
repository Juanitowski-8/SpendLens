package com.spendlens.backend.gmail;

import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class GmailPromotionalFilter {

    private static final String[] PROMOTIONAL_KEYWORDS = {
            "deal",
            "deals",
            "top deals",
            "sale",
            "offer",
            "oferta",
            "promoción",
            "promocion",
            "descuento",
            "newsletter",
            "marketing",
            "unsubscribe",
            "% off",
            "off today",
            "limited time"
    };

    public boolean isPromotionalEmail(String subject, String snippet, String from) {
        String combined = buildHaystack(subject, snippet, from);

        for (String keyword : PROMOTIONAL_KEYWORDS) {
            if (combined.contains(keyword)) {
                return true;
            }
        }

        return isNoReplyPromotionalWithoutReceipt(subject, snippet, from);
    }

    public boolean isPromotionalMerchantOrDescription(String merchant, String description) {
        String combined = buildHaystack(merchant, description, "");

        if (combined.contains("deals") || combined.contains("top deal")) {
            return true;
        }

        for (String keyword : PROMOTIONAL_KEYWORDS) {
            if (combined.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    private boolean isNoReplyPromotionalWithoutReceipt(String subject, String snippet, String from) {
        String fromLower = safe(from).toLowerCase(Locale.ROOT);
        if (!fromLower.contains("no-reply") && !fromLower.contains("noreply")) {
            return false;
        }

        String combined = buildHaystack(subject, snippet, "");
        boolean hasReceiptSignal = combined.contains("recibo")
                || combined.contains("receipt")
                || combined.contains("factura")
                || combined.contains("payment")
                || combined.contains("pago")
                || combined.contains("total")
                || combined.contains("charged");

        return !hasReceiptSignal;
    }

    private String buildHaystack(String... parts) {
        return (" " + String.join(" ", parts) + " ").toLowerCase(Locale.ROOT);
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
