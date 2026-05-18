package com.spendlens.backend.gmail;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GmailReceiptParser {

    public Optional<ParsedGmailReceipt> parse(
            String subject,
            String snippet,
            String from,
            Long internalDateMillis
    ) {
        String combined = String.join(
                "\n",
                safe(subject),
                safe(snippet),
                safe(from)
        ).trim();

        if (combined.isBlank()) {
            return Optional.empty();
        }

        Optional<BigDecimal> amount = extractAmount(combined);
        if (amount.isEmpty()) {
            return Optional.empty();
        }

        String merchant = extractMerchant(combined, from);
        String currency = extractCurrency(combined);
        LocalDate transactionDate = internalDateMillis != null
                ? Instant.ofEpochMilli(internalDateMillis).atZone(ZoneId.systemDefault()).toLocalDate()
                : extractDate(combined);

        String description = truncate("Gmail: " + safe(subject) + " — " + safe(snippet), 500);

        return Optional.of(new ParsedGmailReceipt(merchant, amount.get(), currency, transactionDate, description));
    }

    private String extractMerchant(String text, String from) {
        String lower = text.toLowerCase(Locale.ROOT);

        if (lower.contains("uber")) {
            return "Uber";
        }
        if (lower.contains("netflix")) {
            return "Netflix";
        }
        if (lower.contains("rappi")) {
            return "Rappi";
        }
        if (lower.contains("exito") || lower.contains("éxito")) {
            return "Éxito";
        }
        if (lower.contains("spotify")) {
            return "Spotify";
        }

        if (from != null && !from.isBlank()) {
            Matcher fromMatcher = Pattern.compile("^\\s*([^<]+)").matcher(from.trim());
            if (fromMatcher.find()) {
                String name = fromMatcher.group(1).replace("\"", "").trim();
                if (!name.isBlank() && !name.contains("@")) {
                    return truncate(name, 180);
                }
            }

            Matcher emailMatcher = Pattern.compile("([\\p{L}0-9._-]+)@").matcher(from);
            if (emailMatcher.find()) {
                return truncate(emailMatcher.group(1), 180);
            }
        }

        Pattern merchantPattern = Pattern.compile(
                "(?i)(?:recibo de|compra en|pago a|comercio:)\\s+([\\p{L}\\p{N}\\s]+)"
        );
        Matcher matcher = merchantPattern.matcher(text);
        if (matcher.find()) {
            return truncate(matcher.group(1).trim(), 180);
        }

        return "Comercio Gmail";
    }

    private Optional<BigDecimal> extractAmount(String text) {
        Pattern amountWithCurrencyPattern = Pattern.compile(
                "(\\d+(?:[.,]\\d{1,2})?)\\s*(?:COP|USD|EUR)",
                Pattern.CASE_INSENSITIVE
        );
        Matcher currencyMatcher = amountWithCurrencyPattern.matcher(text);
        if (currencyMatcher.find()) {
            return Optional.of(parseAmount(currencyMatcher.group(1)));
        }

        Pattern amountAfterMoneyWordsPattern = Pattern.compile(
                "(?i)(?:por|valor de|total de|monto de|pag[oó])\\s+\\$?\\s*(\\d+(?:[.,]\\d{1,2})?)"
        );
        Matcher moneyWordsMatcher = amountAfterMoneyWordsPattern.matcher(text);
        if (moneyWordsMatcher.find()) {
            return Optional.of(parseAmount(moneyWordsMatcher.group(1)));
        }

        Pattern fallbackAmountPattern = Pattern.compile("\\$?\\s*(\\d+(?:[.,]\\d{1,2})?)");
        Matcher fallbackMatcher = fallbackAmountPattern.matcher(text);
        while (fallbackMatcher.find()) {
            BigDecimal amount = parseAmount(fallbackMatcher.group(1));
            if (amount.compareTo(BigDecimal.ZERO) > 0) {
                return Optional.of(amount);
            }
        }

        return Optional.empty();
    }

    private BigDecimal parseAmount(String rawAmount) {
        String cleanedAmount = rawAmount.trim();

        if (cleanedAmount.contains(",") && cleanedAmount.contains(".")) {
            cleanedAmount = cleanedAmount.replace(".", "").replace(",", ".");
        } else if (cleanedAmount.contains(",")) {
            cleanedAmount = cleanedAmount.replace(",", ".");
        }

        return new BigDecimal(cleanedAmount);
    }

    private String extractCurrency(String text) {
        String upper = text.toUpperCase(Locale.ROOT);

        if (upper.contains("USD")) {
            return "USD";
        }
        if (upper.contains("EUR")) {
            return "EUR";
        }

        return "COP";
    }

    private LocalDate extractDate(String text) {
        Pattern isoDatePattern = Pattern.compile("(\\d{4}-\\d{2}-\\d{2})");
        Matcher isoMatcher = isoDatePattern.matcher(text);
        if (isoMatcher.find()) {
            return LocalDate.parse(isoMatcher.group(1));
        }

        return LocalDate.now();
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private String truncate(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }

        return value.substring(0, maxLength - 1) + "…";
    }

    public record ParsedGmailReceipt(
            String merchant,
            BigDecimal amount,
            String currency,
            LocalDate transactionDate,
            String description
    ) {
    }
}
