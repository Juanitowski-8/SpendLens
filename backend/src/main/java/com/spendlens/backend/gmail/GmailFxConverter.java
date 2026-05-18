package com.spendlens.backend.gmail;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.Optional;

@Component
public class GmailFxConverter {

    private final BigDecimal usdToCop;
    private final BigDecimal cadToCop;
    private final BigDecimal eurToCop;
    private final BigDecimal gbpToCop;

    public GmailFxConverter(
            @Value("${app.fx.usd-to-cop:4000}") BigDecimal usdToCop,
            @Value("${app.fx.cad-to-cop:3000}") BigDecimal cadToCop,
            @Value("${app.fx.eur-to-cop:4300}") BigDecimal eurToCop,
            @Value("${app.fx.gbp-to-cop:5000}") BigDecimal gbpToCop
    ) {
        this.usdToCop = usdToCop;
        this.cadToCop = cadToCop;
        this.eurToCop = eurToCop;
        this.gbpToCop = gbpToCop;
    }

    public Optional<ConvertedAmount> convertToCop(BigDecimal amount, String currencyCode) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return Optional.empty();
        }

        String currency = normalizeCurrency(currencyCode);

        return switch (currency) {
            case "COP" -> Optional.of(new ConvertedAmount(amount, "COP", amount, null));
            case "USD" -> Optional.of(convertForeign(amount, "USD", usdToCop));
            case "CAD" -> Optional.of(convertForeign(amount, "CAD", cadToCop));
            case "EUR" -> Optional.of(convertForeign(amount, "EUR", eurToCop));
            case "GBP" -> Optional.of(convertForeign(amount, "GBP", gbpToCop));
            default -> Optional.empty();
        };
    }

    public String detectCurrencyFromText(String text) {
        String lower = text == null ? "" : text.toLowerCase(Locale.ROOT);

        if (lower.contains("cop") || lower.contains("col$")) {
            return "COP";
        }
        if (lower.contains("cad") || lower.contains("ca$") || lower.contains("canadian")) {
            return "CAD";
        }
        if (lower.contains("eur") || lower.contains("€")) {
            return "EUR";
        }
        if (lower.contains("gbp") || lower.contains("£")) {
            return "GBP";
        }
        if (lower.contains("usd") || lower.contains("us$") || lower.contains("u$s")
                || lower.contains("dollar") || lower.contains("dollars")) {
            return "USD";
        }

        if (text != null && text.contains("$") && !lower.contains("cop")) {
            return "USD";
        }

        return "COP";
    }

    private ConvertedAmount convertForeign(BigDecimal amount, String originalCurrency, BigDecimal rate) {
        BigDecimal copAmount = amount.multiply(rate).setScale(0, RoundingMode.HALF_UP);
        return new ConvertedAmount(copAmount, "COP", amount, originalCurrency);
    }

    private String normalizeCurrency(String currencyCode) {
        if (currencyCode == null || currencyCode.isBlank()) {
            return "COP";
        }

        return currencyCode.trim().toUpperCase(Locale.ROOT);
    }

    public record ConvertedAmount(
            BigDecimal amountCop,
            String storedCurrency,
            BigDecimal originalAmount,
            String originalCurrency
    ) {
        public String conversionNote() {
            if (originalCurrency == null || originalAmount == null) {
                return "";
            }

            return " Importado desde Gmail. Monto original: "
                    + originalCurrency
                    + " "
                    + originalAmount.stripTrailingZeros().toPlainString()
                    + ". Convertido a COP.";
        }
    }
}
